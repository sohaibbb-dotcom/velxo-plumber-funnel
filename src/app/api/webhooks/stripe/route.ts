import "server-only";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { acquireEventLock, processDepositPaid, releaseEventLock } from "@/lib/depositFulfillment";

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
