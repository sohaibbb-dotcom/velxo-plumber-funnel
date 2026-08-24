import "server-only";
import Stripe from "stripe";
import { isPlan, PLAN_MONTHLY_PRICE_AUD, type Plan } from "@/lib/plans";
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

/**
 * Best-effort acquisition context for the resulting Subscription/Session
 * objects — diagnostic only, read straight off the already-trusted
 * onboarding_submissions row (never re-accepted from the browser at this
 * point). Stripe metadata values must be strings, so undefined/null fields
 * are simply omitted rather than sent as "null" text.
 */
function buildAttributionMetadata(submission: OnboardingSubmissionRow): Record<string, string> {
  const fields: Record<string, string | null> = {
    meta_ad_id: submission.meta_ad_id,
    meta_adset_id: submission.meta_adset_id,
    meta_campaign_id: submission.meta_campaign_id,
    meta_creative_id: submission.meta_creative_id,
    fbclid: submission.fbclid,
    utm_source: submission.utm_source,
    utm_medium: submission.utm_medium,
    utm_campaign: submission.utm_campaign,
    utm_content: submission.utm_content,
    utm_term: submission.utm_term,
  };
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value) out[key] = value;
  }
  return out;
}

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
  const monthlyPrice = PLAN_MONTHLY_PRICE_AUD[submission.plan];
  const attributionMetadata = buildAttributionMetadata(submission);

  // Stripe Checkout's fixed subscription-mode template always headlines the
  // recurring price (that IS what's being subscribed to) — there is no API
  // parameter that reorders or re-emphasizes that hierarchy. custom_text.submit
  // is the one supported, prominent slot for supplementary text: it renders
  // directly beside the "Subscribe" button, the last thing a customer reads
  // before paying. Only ever set on the genuine-trial path — omitted
  // entirely when eligibleForTrial is false, since a repeat customer with no
  // trial genuinely is charged today, and this text must never claim
  // otherwise.
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      ...(eligibleForTrial ? { trial_period_days: TRIAL_PERIOD_DAYS } : {}),
      metadata: { onboarding_submission_id: submission.id, plan: submission.plan, ...attributionMetadata },
    },
    ...(eligibleForTrial
      ? {
          custom_text: {
            submit: {
              message: `A$0 due today. Your ${TRIAL_PERIOD_DAYS}-day free trial starts now — you won't be charged A$${monthlyPrice}/month until it ends, and you can cancel anytime before then to pay nothing.`,
            },
          },
        }
      : {}),
    // The Stripe webhook (Phase 2) will look up this same submission by
    // public_id, the same pattern the legacy deposit flow already uses —
    // never trust name/email typed into Stripe's own checkout form.
    client_reference_id: submission.public_id,
    customer_email: submission.business_email,
    metadata: { onboarding_submission_id: submission.id, plan: submission.plan, ...attributionMetadata },
    success_url: `${origin}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/onboarding/cancelled`,
  });

  if (!session.url) {
    throw new Error(`Stripe checkout session ${session.id} did not include a redirect URL.`);
  }

  // Fail-closed invariant: never hand the customer a URL that contradicts
  // what our own onboarding page just promised them. If we believe this
  // customer is trial-eligible, Stripe's own session MUST agree that
  // nothing is due today — trust the session Stripe actually created, not
  // just the request we sent it. A mismatch here (e.g. the configured Price
  // itself has conflicting trial settings, or a future Stripe API change)
  // must surface as a loud, safe error, never as a customer silently
  // reaching a checkout demanding immediate payment after being told
  // "$0 today" on our own page.
  if (eligibleForTrial && session.amount_total !== 0) {
    console.error(
      `Trial-eligibility contradiction for submission ${submission.id}: eligibleForTrial=true but ` +
        `Stripe session ${session.id} has amount_total=${session.amount_total} (expected 0). Refusing to redirect.`,
    );
    throw new Error(
      `Stripe session ${session.id} does not match the expected trial terms — refusing to send the customer to a contradictory checkout.`,
    );
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
