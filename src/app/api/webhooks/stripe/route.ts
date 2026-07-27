import "server-only";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { addTag, upsertContact, upsertOpportunity, DEPOSIT_PAID_TAG } from "@/lib/highlevel";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";

// Needs the raw request body for Stripe's signature check — not available
// under the edge runtime's body-parsing behaviour.
export const runtime = "nodejs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
// The Stripe Payment Link id (starts "plink_...") for the A$500 setup
// deposit — a read-only value copied from the Stripe Dashboard, not
// something this project edits. Required: without it, there is no reliable
// way to tell the deposit link apart from the completion-payment link on a
// shared webhook endpoint, so processing is refused rather than guessed at.
const STRIPE_DEPOSIT_PAYMENT_LINK_ID = process.env.STRIPE_DEPOSIT_PAYMENT_LINK_ID;

function getStripeCustomerId(customer: Stripe.Checkout.Session["customer"]): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function findSubmissionByPublicId(publicId: string): Promise<OnboardingSubmissionRow | null> {
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
async function acquireEventLock(eventId: string): Promise<boolean> {
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
async function releaseEventLock(eventId: string): Promise<void> {
  const { error } = await supabaseServer.from("stripe_processed_events").delete().eq("event_id", eventId);
  if (error) {
    console.error(`Failed to release Stripe event lock for ${eventId} after a processing error:`, error.message);
  }
}

async function processDepositPaid(session: Stripe.Checkout.Session, event: Stripe.Event): Promise<void> {
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

export async function POST(request: Request) {
  if (!STRIPE_SECRET_KEY) {
    console.error("Missing environment variable: STRIPE_SECRET_KEY");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("Missing environment variable: STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!STRIPE_DEPOSIT_PAYMENT_LINK_ID) {
    console.error("Missing environment variable: STRIPE_DEPOSIT_PAYMENT_LINK_ID");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Only these two event types can carry a paid Checkout Session; every
  // other event type (subscription updates, invoice events, etc.) is
  // acknowledged and ignored here.
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Gate 1: this must be the A$500 deposit Payment Link specifically — the
  // completion-payment link must never trigger this flow.
  if (session.payment_link !== STRIPE_DEPOSIT_PAYMENT_LINK_ID) {
    return NextResponse.json({ received: true, skipped: "not the deposit payment link" });
  }

  // Gate 2: the session must actually be paid. checkout.session.completed
  // can fire with payment_status "unpaid" for delayed payment methods —
  // async_payment_succeeded is what confirms those once funds clear.
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: "payment not yet confirmed paid" });
  }

  // Gate 3: idempotency lock, acquired before any HighLevel/Supabase writes.
  let lockAcquired: boolean;
  try {
    lockAcquired = await acquireEventLock(event.id);
  } catch {
    return NextResponse.json({ error: "Could not acquire idempotency lock" }, { status: 500 });
  }
  if (!lockAcquired) {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  try {
    await processDepositPaid(session, event);
  } catch (err) {
    console.error(`Failed to process deposit-paid event ${event.id}:`, err instanceof Error ? err.message : err);
    await releaseEventLock(event.id);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
