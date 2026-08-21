import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createSubscriptionCheckoutSession } from "@/lib/stripe/subscriptionCheckout";
import { checkPriorTrial } from "@/lib/onboarding/trialEligibility";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";

/**
 * Creates a Stripe subscription Checkout Session for an onboarding
 * submission already created via /api/onboarding-submissions. Same-origin
 * only — called by src/app/onboarding (this app's own wizard), not by the
 * legacy cross-origin onboarding.html, so no CORS handling is needed here.
 */

const GENERIC_ERROR = "We couldn't start checkout. Please try again.";

type RequestBody = {
  publicId?: unknown;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const publicId = typeof body.publicId === "string" ? body.publicId.trim() : "";
  if (!publicId) {
    return NextResponse.json(
      { success: false, error: "Missing onboarding reference." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("onboarding_submissions")
    .select("*")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error || !data) {
    console.error("checkout-session: onboarding_submissions lookup failed:", error?.message);
    return NextResponse.json(
      { success: false, error: "We couldn't find that onboarding submission." },
      { status: 404 },
    );
  }

  // Trusts only the plan already stored on the vetted row — never a
  // client-resent value — same pattern as processDepositPaid trusting only
  // the onboarding_submissions row, never Stripe's own checkout form input.
  const submission = data as OnboardingSubmissionRow;
  if (!submission.plan) {
    return NextResponse.json(
      { success: false, error: "This submission has no plan selected." },
      { status: 400 },
    );
  }

  // Guards a multi-tab/stale-retry edge case introduced by the two-phase
  // funnel: a customer could complete Stripe checkout in one tab while an
  // older tab's cached publicId (stored client-side for the cancelled-page
  // "try again" flow) still points at the same row. Without this check,
  // that stale retry would mint a second Checkout Session for a row whose
  // trial has already started, and the webhook would overwrite this row's
  // subscription ids with the second session's — orphaning the first.
  // trial_starts_at is only ever set by the webhook-confirmed
  // processSubscriptionStarted, so this can't false-positive on an opened-
  // but-abandoned session.
  if (submission.trial_starts_at) {
    return NextResponse.json(
      { success: false, error: "This trial has already started." },
      { status: 409 },
    );
  }

  try {
    // Server-side only — trial eligibility is never accepted from the
    // browser. A prior trial for this business identity (matched on email,
    // AU phone, or ABN) means this checkout still proceeds, just without
    // trial_period_days — see checkPriorTrial and createSubscriptionCheckoutSession.
    const priorTrial = await checkPriorTrial({
      businessEmail: submission.business_email,
      businessPhone: submission.business_phone,
      abn: submission.abn,
    });
    const eligibleForTrial = !priorTrial.hasPrior;

    // Safe to log: a UUID and a category, never the actual email/phone/ABN.
    // This is what makes a "customer saw $297 due today" report traceable to
    // an exact cause (a real prior trial vs. a genuine misconfiguration)
    // instead of a guess.
    console.log(
      `checkout-session: submission ${submission.id} eligibleForTrial=${eligibleForTrial}` +
        (priorTrial.matchedOn ? ` (denied — matched prior trial on: ${priorTrial.matchedOn})` : ""),
    );

    const { url } = await createSubscriptionCheckoutSession({
      submission,
      origin: new URL(request.url).origin,
      eligibleForTrial,
    });
    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error(
      "Failed to create Stripe subscription checkout session:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 });
  }
}
