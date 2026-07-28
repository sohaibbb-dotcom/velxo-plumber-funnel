import "server-only";
import type Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";
import { addTag, upsertContact, upsertOpportunity, DEPOSIT_PAID_TAG } from "@/lib/highlevel";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";

/**
 * The deposit-paid fulfilment logic, extracted out of the Stripe webhook
 * route so it's an importable, independently-invokable unit — used both by
 * the real webhook (src/app/api/webhooks/stripe/route.ts) and by one-off
 * server-side verification scripts that need to exercise the exact same
 * code path without a real Stripe event. Never exposed as an HTTP route
 * itself.
 */

export function getStripeCustomerId(customer: Stripe.Checkout.Session["customer"]): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export async function findSubmissionByPublicId(publicId: string): Promise<OnboardingSubmissionRow | null> {
  const { data, error } = await supabaseServer
    .from("onboarding_submissions")
    .select("*")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) {
    console.error("Failed to look up onboarding_submissions by public_id:", error.message);
    return null;
  }
  return (data as OnboardingSubmissionRow) ?? null;
}

/**
 * Acquires the idempotency lock for this Stripe event id. Returns true if
 * this request now owns the lock (safe to proceed), false if another
 * request already holds it (a genuine duplicate delivery — skip). Uses an
 * INSERT-first unique-constraint violation rather than a "check, then act"
 * read, which would have a race window between two concurrent deliveries.
 */
export async function acquireEventLock(eventId: string): Promise<boolean> {
  const { error } = await supabaseServer
    .from("stripe_processed_events")
    .insert({ event_id: eventId });

  if (!error) return true;
  // Postgres unique_violation — this event is already locked/processed.
  if (error.code === "23505") return false;

  // Any other error (e.g. transient DB issue): fail closed. Better to miss
  // processing one event and let Stripe retry than to risk a double-send
  // if the lock write itself is unreliable right now.
  console.error("Failed to acquire Stripe event lock:", error.message);
  throw new Error("Could not acquire idempotency lock");
}

/** Releases the lock after a failed processing attempt, so a genuine Stripe retry can succeed later. */
export async function releaseEventLock(eventId: string): Promise<void> {
  const { error } = await supabaseServer.from("stripe_processed_events").delete().eq("event_id", eventId);
  if (error) {
    console.error(`Failed to release Stripe event lock for ${eventId} after a processing error:`, error.message);
  }
}

export async function processDepositPaid(session: Stripe.Checkout.Session, event: Stripe.Event): Promise<void> {
  const publicId = session.client_reference_id;
  if (!publicId) {
    console.error(`Stripe session ${session.id} (event ${event.id}) has no client_reference_id — cannot resolve which business this deposit belongs to.`);
    return;
  }

  const submission = await findSubmissionByPublicId(publicId);
  if (!submission) {
    console.error(`Stripe session ${session.id} (event ${event.id}) referenced public_id ${publicId}, but no matching onboarding_submissions row was found.`);
    return;
  }

  // Deliberately never reads session.customer_details here — name/email/
  // phone must come from the vetted onboarding record, not whatever the
  // payer typed into Stripe's own checkout form.
  const { contactId } = await upsertContact({
    email: submission.business_email,
    phone: submission.business_phone,
    firstName: submission.owner_name.trim().split(/\s+/)[0] ?? submission.owner_name,
    lastName: submission.owner_name.trim().split(/\s+/).slice(1).join(" "),
    businessName: submission.business_name,
  });

  await addTag(contactId, DEPOSIT_PAID_TAG);

  const { opportunityId } = await upsertOpportunity({
    contactId,
    name: `${submission.business_name} — Deposit Paid`,
  });

  const { error: updateError } = await supabaseServer
    .from("onboarding_submissions")
    .update({
      status: "deposit_paid",
      stripe_session_id: session.id,
      stripe_customer_id: getStripeCustomerId(session.customer),
      payment_status: session.payment_status,
      deposit_paid_at: new Date().toISOString(),
      webhook_event_id: event.id,
      ghl_contact_id: contactId,
      ghl_opportunity_id: opportunityId,
    })
    .eq("id", submission.id);

  if (updateError) {
    // The HighLevel push already succeeded at this point — log loudly, but
    // don't treat this as a failed attempt (that would re-run the HighLevel
    // calls on retry). This is a Supabase bookkeeping gap to fix manually,
    // not a reason to risk a duplicate contact/opportunity/tag.
    console.error(`Deposit for submission ${submission.id} pushed to HighLevel, but updating Supabase failed:`, updateError.message);
  }
}
