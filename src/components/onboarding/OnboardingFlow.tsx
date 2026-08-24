"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { siteConfig } from "@/config/site";
import { PLAN_LABELS, type Plan } from "@/lib/plans";
import { FormField } from "@/components/onboarding/FormField";
import { TrialReassurance } from "@/components/onboarding/TrialReassurance";
import { StepLoading } from "@/components/onboarding/StepLoading";
import { StepError } from "@/components/onboarding/StepError";
import { PrecheckoutShowcase } from "@/components/onboarding/PrecheckoutShowcase";
import { trackFunnelEvent } from "@/lib/analytics/events";
import { getStoredAttribution } from "@/lib/attribution";

const GENERIC_ERROR = "We couldn't save your details. Please try again.";
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The sessionStorage key the cancelled page's "Try again" retry reads —
 * written the moment Phase 1's create succeeds, so a Stripe-cancel retry can
 * mint a fresh Checkout Session for the SAME row instead of creating a
 * second one. See src/components/onboarding/CancelledRetry.tsx.
 */
export const ONBOARDING_PUBLIC_ID_STORAGE_KEY = "velxo_onboarding_public_id";

type MinimalFormData = {
  businessName: string;
  ownerName: string;
  businessPhone: string;
  businessEmail: string;
};

const emptyForm: MinimalFormData = {
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
 */
async function submitMinimalOnboarding(
  data: MinimalFormData,
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

export function OnboardingFlow({ plan, previewPublicId }: { plan: Plan; previewPublicId: string | null }) {
  const [formData, setFormData] = useState<MinimalFormData>(emptyForm);
  const [phase, setPhase] = useState<"form" | "loading" | "error">("form");
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fires once per page visit, independent of form interaction — this is
  // what lets us distinguish "CTA clicked -> onboarding reached" from "CTA
  // clicked -> onboarding never loaded". Ref-guarded (not just an empty
  // dependency array) so React Strict Mode's deliberate double-invoke of
  // effects in development can never duplicate it.
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

  // Fires once, on the FIRST interaction with any of the four fields — not
  // once per keystroke, not once per field switched. Distinguishes "viewed
  // but never touched the form" from "began the form, abandoned before
  // submission". The ref check is inlined directly in the event handler
  // (rather than a separate helper function) so it's unambiguous to React's
  // eslint rules that this ref is only ever read/written from an event
  // handler, never during render.
  const hasStartedRef = useRef(false);

  const update =
    (field: keyof MinimalFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        trackFunnelEvent("OnboardingStart", { plan });
      }
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPhase("loading");

    submitMinimalOnboarding(formData, plan, previewPublicId).then((result) => {
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

      {phase === "form" ? (
        <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-14">
          <PrecheckoutShowcase />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormField
                label="Business Name"
                required
                autoComplete="organization"
                value={formData.businessName}
                onChange={update("businessName")}
                placeholder="Mate's Plumbing & Gas Pty Ltd"
              />
              <FormField
                label="Owner / Contact Name"
                required
                autoComplete="name"
                value={formData.ownerName}
                onChange={update("ownerName")}
                placeholder="Alex Mate"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Business Phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={formData.businessPhone}
                  onChange={update("businessPhone")}
                  placeholder="0400 000 000"
                />
                <FormField
                  label="Business Email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.businessEmail}
                  onChange={update("businessEmail")}
                  placeholder="you@business.com.au"
                />
              </div>

              <TrialReassurance plan={plan} />

              <button
                type="submit"
                className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
              >
                Continue to Secure Checkout →
              </button>
              <p className="text-center text-xs text-white/35">
                No charge today · Card required · Cancel anytime
              </p>
            </form>
          </motion.div>
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
            <AnimatePresence mode="wait">
              {phase === "loading" && <StepLoading key="loading" />}
              {phase === "error" && (
                <StepError key="error" message={errorMessage} onRetry={() => setPhase("form")} />
              )}
            </AnimatePresence>
          </div>
        </main>
      )}
    </div>
  );
}
