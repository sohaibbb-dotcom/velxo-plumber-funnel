"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Wrench } from "lucide-react";
import { siteConfig } from "@/config/site";
import { PLAN_LABELS, PLAN_MONTHLY_PRICE_AUD, type Plan } from "@/lib/plans";
import { StepLoading } from "@/components/onboarding/StepLoading";
import { StepError } from "@/components/onboarding/StepError";
import { CalculatorStep, type CalculatorValues } from "@/components/onboarding/CalculatorStep";
import { ResultStep } from "@/components/onboarding/ResultStep";
import { DetailsStep, type BusinessDetails } from "@/components/onboarding/DetailsStep";
import { CommitmentStep } from "@/components/onboarding/CommitmentStep";
import { trackFunnelEvent } from "@/lib/analytics/events";
import { getStoredAttribution } from "@/lib/attribution";

const GENERIC_ERROR = "We couldn't save your details. Please try again.";

/**
 * The sessionStorage key the cancelled page's "Try again" retry reads —
 * written the moment Phase 1's create succeeds, so a Stripe-cancel retry can
 * mint a fresh Checkout Session for the SAME row instead of creating a
 * second one. See src/components/onboarding/CancelledRetry.tsx.
 */
export const ONBOARDING_PUBLIC_ID_STORAGE_KEY = "velxo_onboarding_public_id";

const emptyDetails: BusinessDetails = {
  businessName: "",
  ownerName: "",
  businessPhone: "",
  businessEmail: "",
};

type SubmitResult = { success: true; checkoutUrl: string } | { success: false; error: string };

/**
 * Phase 1 of the two-phase onboarding funnel: creates a minimal
 * onboarding_submissions row (just enough for Stripe + trial-abuse
 * matching), then immediately starts Stripe Checkout. Everything else
 * (verification, AI setup, website setup) is collected AFTER checkout, on
 * the success page — see src/app/onboarding/success.
 *
 * Unchanged by the missed-call-calculator redesign — the redesign only
 * changes WHEN this is called (now from the CommitmentStep, at the end of a
 * longer UI sequence) and WHAT is shown beforehand, never the submission
 * logic, the fields it sends, or the events it fires.
 */
async function submitMinimalOnboarding(
  data: BusinessDetails,
  plan: Plan,
  previewPublicId: string | null,
): Promise<SubmitResult> {
  try {
    const submissionRes = await fetch("/api/onboarding-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: data.businessName,
        ownerName: data.ownerName,
        businessPhone: data.businessPhone,
        businessEmail: data.businessEmail,
        plan,
        previewPublicId: previewPublicId ?? undefined,
        attribution: getStoredAttribution(),
      }),
    });

    const submissionPayload = await submissionRes.json().catch(() => null);
    if (!submissionRes.ok || !submissionPayload?.success) {
      const message =
        typeof submissionPayload?.error === "string" && submissionPayload.error.length > 0
          ? submissionPayload.error
          : GENERIC_ERROR;
      return { success: false, error: message };
    }

    const publicId = submissionPayload.referenceId as string | undefined;
    if (!publicId) {
      return { success: false, error: GENERIC_ERROR };
    }

    // Fired only now the application has actually accepted the submission
    // (a 2xx with success:true and a real reference id) — not merely because
    // the submit button was clicked, and not on a validation failure above.
    trackFunnelEvent("OnboardingComplete", {
      plan,
      previewPublicId: previewPublicId ?? undefined,
      onboardingSubmissionId: publicId,
      metadata: { linkedToPreview: previewPublicId != null },
    });

    // Written before the checkout-session call (not after redirect), so a
    // cancelled/interrupted redirect still leaves the retry path usable.
    try {
      window.sessionStorage.setItem(ONBOARDING_PUBLIC_ID_STORAGE_KEY, publicId);
    } catch {
      // Private-browsing/storage-disabled: the cancelled-page retry simply
      // won't have a stored id to offer — falls back to its generic CTA.
    }

    const checkoutRes = await fetch("/api/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    const checkoutPayload = await checkoutRes.json().catch(() => null);
    if (!checkoutRes.ok || !checkoutPayload?.success || typeof checkoutPayload.url !== "string") {
      const message =
        typeof checkoutPayload?.error === "string" && checkoutPayload.error.length > 0
          ? checkoutPayload.error
          : "Your details were saved, but we couldn't start checkout. Please try again.";
      return { success: false, error: message };
    }

    // Fired only now Stripe itself has confirmed a real Checkout Session
    // exists (checkoutPayload.success + a url) — not merely because
    // "Continue to Secure Checkout" was clicked. eligibleForTrial/amountDueToday
    // are the same server-computed values the checkout-session route already
    // used to build this session, never re-derived or trusted from elsewhere.
    trackFunnelEvent("CheckoutCreated", {
      plan,
      onboardingSubmissionId: publicId,
      metadata: {
        trialEligible: checkoutPayload.eligibleForTrial === true,
        amountDueTodayIsZero: checkoutPayload.eligibleForTrial === true,
      },
    });

    return { success: true, checkoutUrl: checkoutPayload.url };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

type Phase = "calculator" | "result" | "details" | "commitment" | "loading" | "error";

export function OnboardingFlow({ plan, previewPublicId }: { plan: Plan; previewPublicId: string | null }) {
  const [phase, setPhase] = useState<Phase>("calculator");
  const [calcValues, setCalcValues] = useState<CalculatorValues | null>(null);
  const [details, setDetails] = useState<BusinessDetails>(emptyDetails);
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fires once per page visit, independent of any interaction — lets us
  // distinguish "CTA clicked -> onboarding reached" from "CTA clicked ->
  // onboarding never loaded". Ref-guarded (not just an empty dependency
  // array) so React Strict Mode's deliberate double-invoke of effects in
  // development can never duplicate it.
  const hasViewedRef = useRef(false);
  useEffect(() => {
    if (hasViewedRef.current) return;
    hasViewedRef.current = true;
    trackFunnelEvent("OnboardingView", {
      plan,
      previewPublicId: previewPublicId ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Orchestrator-level "at most once per visit" guards for the three
  // step-entry events. CalculatorStep/DetailsStep each already guard
  // against firing more than once PER MOUNT (first-interaction-only, not
  // per keystroke) — but AnimatePresence fully unmounts/remounts them on
  // every phase change, so a visitor who goes back via "Recalculate" (or
  // back to Details) and touches a field again would otherwise reset that
  // per-mount guard and refire the event. These refs live on the
  // orchestrator itself, which never unmounts for the lifetime of the
  // visit, so they survive every internal step transition. CalculatorComplete
  // is deliberately NOT guarded this way — a genuine recalculation with new
  // numbers is a real, repeatable submission, not a one-time milestone.
  const hasCalculatorStartedRef = useRef(false);
  const hasResultViewedRef = useRef(false);
  const hasDetailsStartedRef = useRef(false);

  const handleCalculatorComplete = (values: CalculatorValues) => {
    const weeklyOpportunity = values.missedCalls * values.avgJobValue;
    const monthlyOpportunity = weeklyOpportunity * 4;
    const annualOpportunity = weeklyOpportunity * 52;
    trackFunnelEvent("CalculatorComplete", {
      plan,
      metadata: {
        incomingCallsPerWeek: values.incomingCalls,
        missedCallsPerWeek: values.missedCalls,
        avgJobValueAud: values.avgJobValue,
        weeklyOpportunityAud: weeklyOpportunity,
        monthlyOpportunityAud: monthlyOpportunity,
        annualOpportunityAud: annualOpportunity,
      },
    });

    // Fired here, at the moment the transition to the result screen is
    // decided — not as a mount-effect inside ResultStep — specifically so
    // it can be guarded once, here, at the orchestrator level. A mount-
    // effect approach would face the exact same remount problem
    // CalculatorStart/DetailsStart had.
    if (!hasResultViewedRef.current) {
      hasResultViewedRef.current = true;
      trackFunnelEvent("ResultViewed", { plan });
    }

    setCalcValues(values);
    setPhase("result");
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPhase("loading");

    submitMinimalOnboarding(details, plan, previewPublicId).then((result) => {
      if (!result.success) {
        setErrorMessage(result.error);
        setPhase("error");
        setIsSubmitting(false);
        return;
      }

      // Loading screen stays visible until Stripe Checkout takes over — a
      // full-page redirect, not router.push, since the destination is
      // external (checkout.stripe.com).
      window.location.href = result.checkoutUrl;
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[420px] w-[720px] rounded-full bg-gradient-to-br from-violet-600/15 via-blue-600/10 to-transparent opacity-80 blur-3xl" />
      </div>

      <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-white">
            <Wrench className="h-3.5 w-3.5" />
          </span>
          {siteConfig.name}
        </Link>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/60">
          {PLAN_LABELS[plan]}
        </span>
      </header>

      <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <AnimatePresence mode="wait">
          {phase === "calculator" && (
            <CalculatorStep
              key="calculator"
              initialValues={calcValues}
              onStart={() => {
                if (hasCalculatorStartedRef.current) return;
                hasCalculatorStartedRef.current = true;
                trackFunnelEvent("CalculatorStart", { plan });
              }}
              onComplete={handleCalculatorComplete}
            />
          )}
          {phase === "result" && calcValues && (
            <ResultStep
              key="result"
              values={calcValues}
              monthlyPrice={PLAN_MONTHLY_PRICE_AUD[plan]}
              onBack={() => setPhase("calculator")}
              onContinue={() => setPhase("details")}
            />
          )}
          {phase === "details" && calcValues && (
            <DetailsStep
              key="details"
              values={details}
              monthlyOpportunity={calcValues.missedCalls * calcValues.avgJobValue * 4}
              onChange={setDetails}
              onStart={() => {
                if (hasDetailsStartedRef.current) return;
                hasDetailsStartedRef.current = true;
                trackFunnelEvent("DetailsStart", { plan });
              }}
              onBack={() => setPhase("result")}
              onContinue={() => setPhase("commitment")}
            />
          )}
          {phase === "commitment" && (
            <CommitmentStep
              key="commitment"
              plan={plan}
              isSubmitting={isSubmitting}
              onBack={() => setPhase("details")}
              onSubmit={handleSubmit}
            />
          )}
          {phase === "loading" && <StepLoading key="loading" />}
          {phase === "error" && (
            <StepError
              key="error"
              message={errorMessage}
              onRetry={() => {
                setIsSubmitting(false);
                setPhase("commitment");
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
