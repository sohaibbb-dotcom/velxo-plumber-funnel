import "server-only";
import Stripe from "stripe";
import { findSubmissionByPublicId } from "@/lib/depositFulfillment";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";

/**
 * The sole way any post-Stripe route (the success page, /api/onboarding-setup)
 * resolves which onboarding_submissions row a browser is allowed to read or
 * write — never by trusting a client-supplied public_id directly. A Stripe
 * Checkout Session id is the credential: only the browser that actually
 * completed THAT specific session ever legitimately holds it (Stripe reveals
 * it via the post-payment redirect to success_url). Requiring
 * session.status === "complete" (not merely a present client_reference_id)
 * closes the narrow gap where a session id copied out of Stripe's own
 * checkout.stripe.com address bar mid-payment — before completion — could
 * otherwise resolve to a row before it's actually paid.
 *
 * Returns null on any failure (missing/invalid session id, not yet
 * completed, Stripe error, no matching row) so every caller has one safe,
 * uniform "couldn't resolve" branch to fall back to.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export async function resolveSubmissionFromSessionId(
  sessionId: string | undefined | null,
): Promise<OnboardingSubmissionRow | null> {
  if (!STRIPE_SECRET_KEY || !sessionId) return null;

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.status !== "complete") return null;

    const publicId = session.client_reference_id;
    if (!publicId) return null;

    return await findSubmissionByPublicId(publicId);
  } catch (err) {
    console.error(
      `Failed to resolve onboarding submission for checkout session ${sessionId}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
