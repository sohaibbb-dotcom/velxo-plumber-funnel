import "server-only";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";
import { addTag, upsertContact, moveOpportunityToStage, TRIAL_STARTED_TAG, AGENCY_PIPELINE_NAME } from "@/lib/highlevel";
import { findSubmissionByPublicId, getStripeCustomerId } from "@/lib/depositFulfillment";

/**
 * Trial-started fulfilment logic for the new subscription Checkout flow
 * (src/lib/stripe/subscriptionCheckout.ts) — the Phase 2 counterpart to
 * processDepositPaid in depositFulfillment.ts. Kept in its own file because
 * its write ordering is deliberately different: Supabase is written FIRST
 * and is authoritative on its own, with HighLevel applied only after that
 * succeeds. The deposit flow's ordering (HighLevel first) is intentionally
 * left alone — see depositFulfillment.ts.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function getSubscriptionId(subscription: Stripe.Checkout.Session["subscription"]): string | null {
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

function toIsoOrNull(unixSeconds: number | null | undefined): string | null {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : null;
}

export async function processSubscriptionStarted(session: Stripe.Checkout.Session, event: Stripe.Event): Promise<void> {
  if (!STRIPE_SECRET_KEY) {
    console.error("Missing environment variable: STRIPE_SECRET_KEY");
    throw new Error("Missing environment variable: STRIPE_SECRET_KEY");
  }

  // Step 1: resolve the onboarding submission from the signed
  // client_reference_id — same anchor the deposit flow uses, never trusting
  // Stripe's own checkout-form fields for identity.
  const publicId = session.client_reference_id;
  if (!publicId) {
    console.error(`Stripe session ${session.id} (event ${event.id}) has no client_reference_id — cannot resolve which onboarding submission this trial belongs to.`);
    return;
  }

  const submission = await findSubmissionByPublicId(publicId);
  if (!submission) {
    console.error(`Stripe session ${session.id} (event ${event.id}) referenced public_id ${publicId}, but no matching onboarding_submissions row was found.`);
    return;
  }

  if (!submission.plan) {
    console.error(`Onboarding submission ${submission.id} (public_id ${publicId}) has no plan set — cannot process trial start for session ${session.id}.`);
    return;
  }

  const subscriptionId = getSubscriptionId(session.subscription);
  if (!subscriptionId) {
    console.error(`Stripe session ${session.id} (event ${event.id}) is a subscription-mode checkout with no subscription id — cannot process trial start.`);
    return;
  }

  // Step 2: retrieve and verify the Stripe subscription. A retrieval
  // failure here is treated as transient (network/API blip) — let it throw
  // so the webhook route releases the idempotency lock and Stripe retries.
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Step 3: extract/validate the authoritative subscription fields.
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const paymentMethodStatus = subscription.default_payment_method ? "collected" : "missing";
  const stripeCustomerId = getStripeCustomerId(session.customer);

  // Step 4: persist to onboarding_submissions FIRST — this table is the
  // subscription/customer source of truth, deliberately ahead of any
  // HighLevel write. Never touches preview_requests.
  const { error: updateError } = await supabaseServer
    .from("onboarding_submissions")
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      stripe_session_id: session.id,
      stripe_price_id: priceId,
      subscription_status: subscription.status,
      trial_starts_at: toIsoOrNull(subscription.trial_start),
      trial_ends_at: toIsoOrNull(subscription.trial_end),
      payment_method_status: paymentMethodStatus,
      webhook_event_id: event.id,
    })
    .eq("id", submission.id);

  // Step 5: a failed Supabase write is not safe to swallow — Supabase is
  // the authoritative record here, so throw, let the route release the
  // idempotency lock, and let Stripe redeliver the event.
  if (updateError) {
    console.error(`Failed to persist subscription state for onboarding submission ${submission.id} (session ${session.id}):`, updateError.message);
    throw new Error(`Could not persist subscription state for submission ${submission.id}`);
  }

  // Step 6: only now touch HighLevel — the authoritative subscription state
  // is already durably stored. Deliberately never reads
  // session.customer_details; name/email/phone come only from the vetted
  // onboarding record, same as the deposit flow.
  const { contactId } = await upsertContact({
    email: submission.business_email,
    phone: submission.business_phone,
    firstName: submission.owner_name.trim().split(/\s+/)[0] ?? submission.owner_name,
    lastName: submission.owner_name.trim().split(/\s+/).slice(1).join(" "),
    businessName: submission.business_name,
  });

  await addTag(contactId, TRIAL_STARTED_TAG);

  // Step 7: if this throws, Supabase's subscription state is already
  // correct and is NOT rolled back — the webhook route releases the lock
  // and Stripe retries. Retrying HighLevel is safe: upsertContact/addTag
  // are idempotent, and moveOpportunityToStage never regresses or
  // duplicates an opportunity.
  const { opportunityId } = await moveOpportunityToStage({
    contactId,
    targetStageName: "Trial Started",
    name: submission.business_name,
  });

  const { error: ghlLinkError } = await supabaseServer
    .from("onboarding_submissions")
    .update({ ghl_contact_id: contactId, ghl_opportunity_id: opportunityId })
    .eq("id", submission.id);

  if (ghlLinkError) {
    // Bookkeeping only at this point — the authoritative subscription state
    // (step 4) and the HighLevel push both already succeeded. Log loudly
    // rather than throw, which would otherwise cause a retry that redoes
    // already-successful HighLevel calls for no benefit.
    console.error(`Trial started for submission ${submission.id}, but recording ghl_contact_id/ghl_opportunity_id failed:`, ghlLinkError.message);
  }

  // Step 8: push the SAME contact into the agency's internal ops pipeline
  // too — a separate pipeline in the same GHL sub-account/location, used to
  // trigger the already-built "New Trial" workflow (internal notification +
  // provisioning task). Reuses contactId from step 6, so this never creates
  // a second HighLevel contact. Runs for both plans identically. If this
  // throws, steps 4-7 above have already durably succeeded — the webhook
  // route still releases the idempotency lock and lets Stripe retry, which
  // is safe here for the same reason step 7 is: moveOpportunityToStage
  // never duplicates or regresses an opportunity.
  await moveOpportunityToStage({
    contactId,
    targetStageName: "New Trial",
    name: submission.business_name,
    pipelineName: AGENCY_PIPELINE_NAME,
  });
}
