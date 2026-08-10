import "server-only";
import Stripe from "stripe";
import { isPlan, type Plan } from "@/lib/plans";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";

/**
 * Creates the Stripe Checkout Session for the new subscription onboarding
 * flow (src/app/onboarding) — distinct from the legacy one-off deposit
 * Payment Link (src/lib/depositFulfillment.ts), which this does not touch.
 *
 * Price ids are env vars, not hardcoded business config like PIPELINE_NAME,
 * so test/live Stripe environments can use different prices without a code
 * change. Never exposed as NEXT_PUBLIC_ — this file is server-only.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_AI_RECEPTIONIST_PRICE_ID = process.env.STRIPE_AI_RECEPTIONIST_PRICE_ID;
const STRIPE_COMPLETE_PRICE_ID = process.env.STRIPE_COMPLETE_PRICE_ID;

const TRIAL_PERIOD_DAYS = 30;

function resolvePriceId(plan: Plan): string {
  const priceId = plan === "ai_receptionist" ? STRIPE_AI_RECEPTIONIST_PRICE_ID : STRIPE_COMPLETE_PRICE_ID;
  if (!priceId) {
    const envVar = plan === "ai_receptionist" ? "STRIPE_AI_RECEPTIONIST_PRICE_ID" : "STRIPE_COMPLETE_PRICE_ID";
    throw new Error(`Missing environment variable: ${envVar}`);
  }
  return priceId;
}

export async function createSubscriptionCheckoutSession({
  submission,
  origin,
  eligibleForTrial,
}: {
  submission: OnboardingSubmissionRow;
  origin: string;
  /**
   * Decided server-side by the caller (src/lib/onboarding/trialEligibility.ts),
   * never from the browser — the client has no way to influence this value.
   * When false (a business identity that already has a prior
   * trial_starts_at on record), trial_period_days is omitted entirely
   * rather than set to 0, which Stripe's API doesn't accept: Checkout then
   * charges the card immediately on completion, same UI, no trial.
   */
  eligibleForTrial: boolean;
}): Promise<{ url: string }> {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing environment variable: STRIPE_SECRET_KEY");
  }
  if (!submission.plan) {
    throw new Error(`Onboarding submission ${submission.id} has no plan set — cannot start checkout.`);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const priceId = resolvePriceId(submission.plan);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      ...(eligibleForTrial ? { trial_period_days: TRIAL_PERIOD_DAYS } : {}),
      metadata: { onboarding_submission_id: submission.id, plan: submission.plan },
    },
    // The Stripe webhook (Phase 2) will look up this same submission by
    // public_id, the same pattern the legacy deposit flow already uses —
    // never trust name/email typed into Stripe's own checkout form.
    client_reference_id: submission.public_id,
    customer_email: submission.business_email,
    metadata: { onboarding_submission_id: submission.id, plan: submission.plan },
    success_url: `${origin}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/onboarding/cancelled`,
  });

  if (!session.url) {
    throw new Error(`Stripe checkout session ${session.id} did not include a redirect URL.`);
  }

  return { url: session.url };
}

/**
 * Resolves which plan a completed Checkout Session was for, straight from
 * Stripe's own session metadata (set at creation time above) — not from a
 * client-supplied query param, and not from onboarding_submissions, which
 * the webhook only populates asynchronously and may not have written yet by
 * the time the customer's browser redirects here. Returns null on any
 * failure (missing/invalid session id, Stripe error, missing/invalid
 * metadata) so callers can fall back to a safe default rather than throw on
 * what is, at worst, a cosmetic lookup for success-page copy.
 */
export async function getPlanForCheckoutSession(sessionId: string): Promise<Plan | null> {
  if (!STRIPE_SECRET_KEY || !sessionId) return null;

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return isPlan(session.metadata?.plan) ? session.metadata.plan : null;
  } catch (err) {
    console.error(
      `Failed to retrieve plan for checkout session ${sessionId}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
