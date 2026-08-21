"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, Check } from "lucide-react";
import { DEFAULT_COLOR_SCHEME } from "@/lib/colorSchemes";
import { type Plan } from "@/lib/plans";
import { StepShell } from "@/components/onboarding/StepShell";
import { StepLoading } from "@/components/onboarding/StepLoading";
import { StepError } from "@/components/onboarding/StepError";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { BusinessStep, BUSINESS_STEP_META } from "@/components/onboarding/steps/BusinessStep";
import { AiSetupStep, AI_SETUP_STEP_META } from "@/components/onboarding/steps/AiSetupStep";
import { WebsiteSetupStep, WEBSITE_SETUP_STEP_META } from "@/components/onboarding/steps/WebsiteSetupStep";
import { ReviewActivateStep, REVIEW_ACTIVATE_STEP_META } from "@/components/onboarding/steps/ReviewActivateStep";
import type { OnboardingFormData } from "@/components/onboarding/types";

const GENERIC_ERROR = "We couldn't save your setup. Please try again.";
const EASE = [0.16, 1, 0.3, 1] as const;

// How long the "your trial is active" confirmation holds before advancing
// into setup on its own — long enough to register as a real confirmation,
// short enough not to read as a delay. No click required to continue.
const CONFIRMATION_HOLD_MS = 1800;

const AI_RECEPTIONIST_STEPS = ["business", "aiSetup", "activate"] as const;
const COMPLETE_STEPS = ["business", "aiSetup", "websiteSetup", "activate"] as const;
type FormStep = (typeof COMPLETE_STEPS)[number];

const STEP_LABELS: Record<FormStep, string> = {
  business: "Verification",
  aiSetup: "AI Setup",
  websiteSetup: "Website Setup",
  activate: "Review",
};

const STEP_META: Record<FormStep, { title: string; description: string }> = {
  business: BUSINESS_STEP_META,
  aiSetup: AI_SETUP_STEP_META,
  websiteSetup: WEBSITE_SETUP_STEP_META,
  activate: REVIEW_ACTIVATE_STEP_META,
};

function buildEmptyForm(businessName: string, businessPhone: string): OnboardingFormData {
  return {
    businessName,
    abn: "",
    businessAddress: "",
    tradingName: "",
    existingWebsite: "",
    verificationDocumentType: null,
    verificationDocumentPath: null,
    verificationDocumentFileName: null,
    verificationDocumentOtherDescription: "",
    addressVerificationDocumentType: null,
    addressVerificationDocumentPath: null,
    addressVerificationDocumentFileName: null,
    ownerName: "",
    businessPhone,
    businessEmail: "",
    // Pre-filled from the already-known business phone — AiSetupStep's
    // "same as business phone" checkbox starts checked and in sync with it.
    notificationMobile: businessPhone,
    services: [],
    suburbsCovered: "",
    openingHours: "Mon–Fri 7:00 AM–5:00 PM",
    hoursMode: "standard",
    standardOpenTime: "07:00",
    standardCloseTime: "17:00",
    customHours: [
      { day: "mon", closed: false, open: "07:00", close: "17:00" },
      { day: "tue", closed: false, open: "07:00", close: "17:00" },
      { day: "wed", closed: false, open: "07:00", close: "17:00" },
      { day: "thu", closed: false, open: "07:00", close: "17:00" },
      { day: "fri", closed: false, open: "07:00", close: "17:00" },
      { day: "sat", closed: true, open: "07:00", close: "17:00" },
      { day: "sun", closed: true, open: "07:00", close: "17:00" },
    ],
    useExistingNumber: null,
    numberPortingNotes: "",
    googleLink: "",
    googlePlaceId: null,
    googleReviewStatus: "idle",
    googleCandidates: [],
    googleSearchQuery: "",
    notes: "",
    colourScheme: DEFAULT_COLOR_SCHEME.name,
    logoPath: null,
    logoFileName: null,
    websitePhotoPaths: [],
    websiteNotes: "",
    referralSource: "",
  };
}

type SubmitResult = { success: true } | { success: false; error: string };

async function submitSetup(sessionId: string, data: OnboardingFormData): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/onboarding-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        abn: data.abn,
        businessAddress: data.businessAddress,
        tradingName: data.tradingName,
        existingWebsite: data.existingWebsite,
        verificationDocumentType: data.verificationDocumentType,
        verificationDocumentPath: data.verificationDocumentPath,
        verificationDocumentOtherDescription: data.verificationDocumentOtherDescription,
        addressVerificationDocumentType: data.addressVerificationDocumentType,
        addressVerificationDocumentPath: data.addressVerificationDocumentPath,
        notificationMobile: data.notificationMobile,
        services: data.services,
        suburbsCovered: data.suburbsCovered,
        openingHours: data.openingHours,
        useExistingNumber: data.useExistingNumber,
        numberPortingNotes: data.numberPortingNotes,
        colourScheme: data.colourScheme,
        logoPath: data.logoPath,
        websitePhotoPaths: data.websitePhotoPaths.map((p) => p.path),
        websiteNotes: data.websiteNotes,
        googleLink: data.googleLink,
        notes: data.notes,
        referralSource: data.referralSource,
      }),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) {
      const message =
        typeof payload?.error === "string" && payload.error.length > 0 ? payload.error : GENERIC_ERROR;
      return { success: false, error: message };
    }
    return { success: true };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

/**
 * Renders on /onboarding/success once Stripe checkout has succeeded but
 * Finish Setup hasn't been completed yet. Deliberately does NOT wait for a
 * click to move from "your trial is active" into setup — a brief, timed
 * confirmation (CONFIRMATION_HOLD_MS) is enough to register the trial
 * genuinely started, then it advances into the same step/progress wizard
 * used for the rest of onboarding.
 */
export function SuccessAndSetupFlow({
  sessionId,
  plan,
  businessName,
  businessPhone,
}: {
  sessionId: string;
  plan: Plan;
  businessName: string;
  businessPhone: string;
}) {
  const FORM_STEPS = plan === "complete" ? COMPLETE_STEPS : AI_RECEPTIONIST_STEPS;

  const [phase, setPhase] = useState<"confirming" | "form" | "submitting" | "done" | "error">("confirming");
  const [formStepIndex, setFormStepIndex] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(() =>
    buildEmptyForm(businessName, businessPhone),
  );
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (phase !== "confirming") return;
    const timer = setTimeout(() => setPhase("form"), CONFIRMATION_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const currentFormStep = FORM_STEPS[formStepIndex];
  const isLastStep = formStepIndex === FORM_STEPS.length - 1;
  const meta = STEP_META[currentFormStep];

  const update =
    (field: keyof OnboardingFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const goNext = () => {
    if (formStepIndex < FORM_STEPS.length - 1) {
      setFormStepIndex((i) => i + 1);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setPhase("submitting");

    submitSetup(sessionId, formData).then((result) => {
      setIsSubmitting(false);
      if (!result.success) {
        setErrorMessage(result.error);
        setPhase("error");
        return;
      }
      setPhase("done");
    });
  };

  const goBack = () => {
    if (formStepIndex > 0) setFormStepIndex((i) => i - 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <AnimatePresence mode="wait">
        {phase === "confirming" && (
          <motion.div
            key="confirming"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex flex-col items-center gap-4 py-10 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"
            >
              <PartyPopper className="h-7 w-7" />
            </motion.span>
            <h1 className="max-w-md text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
              Your 30-day trial is active.
            </h1>
            <p className="max-w-sm text-[15px] leading-relaxed text-white/55">
              Let&apos;s finish setting up your AI Receptionist.
            </p>
          </motion.div>
        )}

        {phase !== "confirming" && phase !== "done" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {phase === "form" && (
              <StepProgress labels={FORM_STEPS.map((s) => STEP_LABELS[s])} activeIndex={formStepIndex} />
            )}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
              <AnimatePresence mode="wait">
                {phase === "form" && (
                  <StepShell
                    key={currentFormStep}
                    eyebrow={`Step ${formStepIndex + 1} of ${FORM_STEPS.length}`}
                    title={meta.title}
                    description={meta.description}
                    onSubmit={goNext}
                    onBack={goBack}
                    isFirstStep={formStepIndex === 0}
                    submitLabel={isLastStep ? "Finish Setup" : "Continue"}
                  >
                    {currentFormStep === "business" && (
                      <BusinessStep formData={formData} update={update} setFormData={setFormData} />
                    )}
                    {currentFormStep === "aiSetup" && (
                      <AiSetupStep
                        formData={formData}
                        update={update}
                        toggleService={toggleService}
                        setFormData={setFormData}
                      />
                    )}
                    {currentFormStep === "websiteSetup" && (
                      <WebsiteSetupStep
                        formData={formData}
                        setFormData={setFormData}
                        onColourChange={(name) => setFormData((prev) => ({ ...prev, colourScheme: name }))}
                      />
                    )}
                    {currentFormStep === "activate" && (
                      <ReviewActivateStep formData={formData} update={update} plan={plan} />
                    )}
                  </StepShell>
                )}
                {phase === "submitting" && (
                  <StepLoading
                    key="submitting"
                    title="Saving your setup..."
                    message="Hang tight while we save your details."
                  />
                )}
                {phase === "error" && (
                  <StepError key="error" message={errorMessage} onRetry={() => setPhase("form")} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex flex-col items-center gap-4 py-10 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Check className="h-7 w-7" strokeWidth={3} />
            </span>
            <h1 className="max-w-md text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
              You&apos;re all set.
            </h1>
            <p className="max-w-sm text-[15px] leading-relaxed text-white/55">
              We&apos;ve got everything we need. We&apos;ll configure your AI Receptionist, connect your
              number, and send your login details once your system is ready.
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
            >
              Back to Velxo
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
