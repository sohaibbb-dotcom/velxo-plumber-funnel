"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { siteConfig } from "@/config/site";
import { DEFAULT_COLOR_SCHEME } from "@/lib/colorSchemes";
import { PLAN_LABELS, type Plan } from "@/lib/plans";
import { StepShell } from "@/components/onboarding/StepShell";
import { StepLoading } from "@/components/onboarding/StepLoading";
import { StepError } from "@/components/onboarding/StepError";
import { BusinessStep, BUSINESS_STEP_META } from "@/components/onboarding/steps/BusinessStep";
import { ContactStep, CONTACT_STEP_META } from "@/components/onboarding/steps/ContactStep";
import { ServicesStep, SERVICES_STEP_META } from "@/components/onboarding/steps/ServicesStep";
import { BrandStep, BRAND_STEP_META } from "@/components/onboarding/steps/BrandStep";
import type { OnboardingFormData } from "@/components/onboarding/types";

const EASE = [0.16, 1, 0.3, 1] as const;
const GENERIC_ERROR = "We couldn't save your details. Please try again.";

const FORM_STEPS = ["business", "contact", "services", "brand"] as const;
type FormStep = (typeof FORM_STEPS)[number];
type Phase = "form" | "loading" | "error";

const STEP_META: Record<FormStep, { eyebrow: string; title: string; description: string }> = {
  business: BUSINESS_STEP_META,
  contact: CONTACT_STEP_META,
  services: SERVICES_STEP_META,
  brand: BRAND_STEP_META,
};

const emptyForm: OnboardingFormData = {
  businessName: "",
  abn: "",
  businessAddress: "",
  ownerName: "",
  businessPhone: "",
  businessEmail: "",
  services: [],
  suburbsCovered: "",
  colourScheme: DEFAULT_COLOR_SCHEME.name,
  googleLink: "",
  notes: "",
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
        businessPhone: data.businessPhone,
        businessEmail: data.businessEmail,
        ownerName: data.ownerName,
        services: data.services,
        suburbsCovered: data.suburbsCovered,
        colourScheme: data.colourScheme,
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
  const [formStepIndex, setFormStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("form");
  const [formData, setFormData] = useState<OnboardingFormData>(emptyForm);
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentFormStep = FORM_STEPS[formStepIndex];
  const progress = phase === "form" ? (formStepIndex / FORM_STEPS.length) * 100 : 100;

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

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] sm:p-10">
            <AnimatePresence mode="wait">
              {phase === "form" && (
                <StepShell
                  key={currentFormStep}
                  eyebrow={meta.eyebrow}
                  title={meta.title}
                  description={meta.description}
                  onSubmit={goNext}
                  onBack={goBack}
                  isFirstStep={formStepIndex === 0}
                  isLastStep={formStepIndex === FORM_STEPS.length - 1}
                >
                  {currentFormStep === "business" && <BusinessStep formData={formData} update={update} />}
                  {currentFormStep === "contact" && <ContactStep formData={formData} update={update} />}
                  {currentFormStep === "services" && (
                    <ServicesStep formData={formData} update={update} toggleService={toggleService} />
                  )}
                  {currentFormStep === "brand" && (
                    <BrandStep
                      formData={formData}
                      update={update}
                      onColourChange={(name) => setFormData((prev) => ({ ...prev, colourScheme: name }))}
                    />
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
    </div>
  );
}
