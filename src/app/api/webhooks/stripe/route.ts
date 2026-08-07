import "server-only";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { acquireEventLock, processDepositPaid, releaseEventLock } from "@/lib/depositFulfillment";
import { processSubscriptionStarted } from "@/lib/subscriptionFulfillment";

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

  // Branch by Checkout Session mode FIRST — "payment" (legacy one-off
  // deposit, via a Payment Link) and "subscription" (new trial signup, via
  // an API-created Checkout Session) are different products sharing one
  // webhook endpoint. session.payment_link is null for API-created
  // sessions, so checking it before branching on mode would silently skip
  // every subscription event.
  if (session.mode === "payment") {
    // Gate 1: this must be the A$500 deposit Payment Link specifically —
    // the completion-payment link must never trigger this flow.
    if (session.payment_link !== STRIPE_DEPOSIT_PAYMENT_LINK_ID) {
      return NextResponse.json({ received: true, skipped: "not the deposit payment link" });
    }

    // Gate 2: the session must actually be paid. checkout.session.completed
    // can fire with payment_status "unpaid" for delayed payment methods —
    // async_payment_succeeded is what confirms those once funds clear.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: "payment not yet confirmed paid" });
    }

    const lockAcquired = await acquireLockOrFail(event.id);
    if (lockAcquired === "already-processed") {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }
    if (lockAcquired === "lock-failed") {
      return NextResponse.json({ error: "Could not acquire idempotency lock" }, { status: 500 });
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

  if (session.mode === "subscription") {
    // The $0-due trial never has an async/delayed payment leg — only the
    // synchronous checkout.session.completed event carries a trial start.
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true, skipped: "async payment event not relevant to trial subscriptions" });
    }

    const lockAcquired = await acquireLockOrFail(event.id);
    if (lockAcquired === "already-processed") {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }
    if (lockAcquired === "lock-failed") {
      return NextResponse.json({ error: "Could not acquire idempotency lock" }, { status: 500 });
    }

    try {
      await processSubscriptionStarted(session, event);
    } catch (err) {
      console.error(`Failed to process subscription-started event ${event.id}:`, err instanceof Error ? err.message : err);
      await releaseEventLock(event.id);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  // Any other Checkout Session mode (e.g. "setup") is not a flow this
  // endpoint drives — acknowledge and ignore.
  return NextResponse.json({ received: true, skipped: "unhandled checkout session mode" });
}

/** Shared idempotency-lock acquisition, used by both the deposit and subscription branches. */
async function acquireLockOrFail(eventId: string): Promise<"acquired" | "already-processed" | "lock-failed"> {
  try {
    const acquired = await acquireEventLock(eventId);
    return acquired ? "acquired" : "already-processed";
  } catch {
    return "lock-failed";
  }
}
