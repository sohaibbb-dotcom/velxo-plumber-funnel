import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createSubscriptionCheckoutSession } from "@/lib/stripe/subscriptionCheckout";
import { hasPriorTrial } from "@/lib/onboarding/trialEligibility";
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

  try {
    // Server-side only — trial eligibility is never accepted from the
    // browser. A prior trial for this business identity (matched on email,
    // AU phone, or ABN) means this checkout still proceeds, just without
    // trial_period_days — see hasPriorTrial and createSubscriptionCheckoutSession.
    const eligibleForTrial = !(await hasPriorTrial({
      businessEmail: submission.business_email,
      businessPhone: submission.business_phone,
      abn: submission.abn,
    }));

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
