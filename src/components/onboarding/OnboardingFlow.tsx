"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Wrench } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { DEFAULT_COLOR_SCHEME } from "@/lib/colorSchemes";
import { PLAN_LABELS, type Plan } from "@/lib/plans";
import { StepShell } from "@/components/onboarding/StepShell";
import { StepLoading } from "@/components/onboarding/StepLoading";
import { StepError } from "@/components/onboarding/StepError";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { ProductExplainer } from "@/components/onboarding/ProductExplainer";
import { TrialReassurance } from "@/components/onboarding/TrialReassurance";
import { WhatHappensNext } from "@/components/onboarding/WhatHappensNext";
import { IntroTransition } from "@/components/onboarding/IntroTransition";
import { PreparingAnimation } from "@/components/onboarding/PreparingAnimation";
import { BusinessStep, BUSINESS_STEP_META } from "@/components/onboarding/steps/BusinessStep";
import { ContactStep, CONTACT_STEP_META } from "@/components/onboarding/steps/ContactStep";
import { AiSetupStep, AI_SETUP_STEP_META } from "@/components/onboarding/steps/AiSetupStep";
import { WebsiteSetupStep, WEBSITE_SETUP_STEP_META } from "@/components/onboarding/steps/WebsiteSetupStep";
import { ReviewActivateStep, REVIEW_ACTIVATE_STEP_META } from "@/components/onboarding/steps/ReviewActivateStep";
import type { OnboardingFormData } from "@/components/onboarding/types";

const GENERIC_ERROR = "We couldn't save your details. Please try again.";

const AI_RECEPTIONIST_STEPS = ["business", "contact", "aiSetup", "activate"] as const;
const COMPLETE_STEPS = ["business", "contact", "aiSetup", "websiteSetup", "activate"] as const;
type FormStep = (typeof COMPLETE_STEPS)[number];

const STEP_LABELS: Record<FormStep, string> = {
  business: "Business",
  contact: "Contact",
  aiSetup: "AI Setup",
  websiteSetup: "Website Setup",
  activate: "Activate",
};

const STEP_META: Record<FormStep, { title: string; description: string }> = {
  business: BUSINESS_STEP_META,
  contact: CONTACT_STEP_META,
  aiSetup: AI_SETUP_STEP_META,
  websiteSetup: WEBSITE_SETUP_STEP_META,
  activate: REVIEW_ACTIVATE_STEP_META,
};

const emptyForm: OnboardingFormData = {
  businessName: "",
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
  businessPhone: "",
  businessEmail: "",
  notificationMobile: "",
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
  notes: "",
  colourScheme: DEFAULT_COLOR_SCHEME.name,
  logoPath: null,
  logoFileName: null,
  websitePhotoPaths: [],
  websiteNotes: "",
  referralSource: "",
};

type SubmitResult = { success: true; checkoutUrl: string } | { success: false; error: string };

async function submitOnboarding(
  data: OnboardingFormData,
  plan: Plan,
  previewPublicId: string | null,
): Promise<SubmitResult> {
  try {
    const submissionRes = await fetch("/api/onboarding-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: data.businessName,
        abn: data.abn,
        businessAddress: data.businessAddress,
        tradingName: data.tradingName,
        existingWebsite: data.existingWebsite,
        verificationDocumentType: data.verificationDocumentType,
        verificationDocumentPath: data.verificationDocumentPath,
        verificationDocumentOtherDescription: data.verificationDocumentOtherDescription,
        addressVerificationDocumentType: data.addressVerificationDocumentType,
        addressVerificationDocumentPath: data.addressVerificationDocumentPath,
        ownerName: data.ownerName,
        businessPhone: data.businessPhone,
        businessEmail: data.businessEmail,
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
        previewPublicId: previewPublicId ?? undefined,
        plan,
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

    return { success: true, checkoutUrl: checkoutPayload.url };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

export function OnboardingFlow({
  plan,
  previewPublicId,
}: {
  plan: Plan;
  previewPublicId: string | null;
}) {
  const FORM_STEPS = plan === "complete" ? COMPLETE_STEPS : AI_RECEPTIONIST_STEPS;

  const [formStepIndex, setFormStepIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "preparing" | "form" | "loading" | "error">("intro");
  const [formData, setFormData] = useState<OnboardingFormData>(emptyForm);
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentFormStep = FORM_STEPS[formStepIndex];
  const isLastStep = formStepIndex === FORM_STEPS.length - 1;

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
    setPhase("loading");

    submitOnboarding(formData, plan, previewPublicId).then((result) => {
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

  const goBack = () => {
    if (formStepIndex > 0) setFormStepIndex((i) => i - 1);
  };

  const meta = STEP_META[currentFormStep];

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[480px] w-[780px] rounded-full bg-gradient-to-tr from-blue-100 via-sky-50 to-transparent opacity-70 blur-3xl" />
      </div>

      <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Wrench className="h-3.5 w-3.5" />
          </span>
          {siteConfig.name}
        </Link>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
          {PLAN_LABELS[plan]}
        </span>
      </header>

      {phase === "intro" && <IntroTransition onStart={() => setPhase("preparing")} />}
      {phase === "preparing" && <PreparingAnimation onDone={() => setPhase("form")} />}

      {(phase === "form" || phase === "loading" || phase === "error") && (
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14",
          plan === "ai_receptionist" ? "max-w-6xl lg:flex-row lg:items-start" : "max-w-xl",
        )}
      >
        {plan === "ai_receptionist" && (
          <div className="flex flex-col gap-6 lg:sticky lg:top-14 lg:w-[420px] lg:shrink-0">
            <ProductExplainer />
            <TrialReassurance plan={plan} />
          </div>
        )}

        <div className="w-full flex-1">
          <StepProgress labels={FORM_STEPS.map((s) => STEP_LABELS[s])} activeIndex={formStepIndex} />
          <WhatHappensNext />

          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] sm:p-10">
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
                  submitLabel={isLastStep ? "Start My 30-Day Free Trial" : "Continue"}
                  submitCaption={isLastStep ? "No charge today. Cancel anytime during your trial." : undefined}
                >
                  {currentFormStep === "business" && (
                    <BusinessStep formData={formData} update={update} setFormData={setFormData} />
                  )}
                  {currentFormStep === "contact" && (
                    <ContactStep formData={formData} update={update} setFormData={setFormData} />
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
              {phase === "loading" && <StepLoading key="loading" />}
              {phase === "error" && (
                <StepError key="error" message={errorMessage} onRetry={() => setPhase("form")} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      )}
    </div>
  );
}
