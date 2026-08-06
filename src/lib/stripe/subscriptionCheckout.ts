import "server-only";
import Stripe from "stripe";
import type { Plan } from "@/lib/plans";
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
}: {
  submission: OnboardingSubmissionRow;
  origin: string;
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
      trial_period_days: TRIAL_PERIOD_DAYS,
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
