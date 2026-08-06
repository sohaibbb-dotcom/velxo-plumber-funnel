"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, ChevronLeft, Loader2, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME } from "@/lib/colorSchemes";
import { PLAN_LABELS, type Plan } from "@/lib/plans";

const EASE = [0.16, 1, 0.3, 1] as const;
const GENERIC_ERROR = "We couldn't save your details. Please try again.";

const SERVICE_OPTIONS = [
  "General Plumbing",
  "Emergency Repairs",
  "Hot Water Systems",
  "Drain Cleaning",
  "Gas Fitting",
  "Bathroom Renovations",
];

const FORM_STEPS = ["business", "contact", "services", "brand"] as const;
type FormStep = (typeof FORM_STEPS)[number];
type Phase = "form" | "loading" | "error";

const STEP_META: Record<FormStep, { eyebrow: string; title: string; description: string }> = {
  business: {
    eyebrow: "Step 1 of 4",
    title: "Tell us about your business",
    description: "We'll use this to set up your Velxo account.",
  },
  contact: {
    eyebrow: "Step 2 of 4",
    title: "Who should we contact?",
    description: "This is who Velxo will reach out to for setup and support.",
  },
  services: {
    eyebrow: "Step 3 of 4",
    title: "What do you offer?",
    description: "Helps us tailor your AI Receptionist's scripts and booking flow.",
  },
  brand: {
    eyebrow: "Step 4 of 4",
    title: "Brand & final details",
    description: "Last step — then it's straight to secure payment for your 30-day free trial.",
  },
};

type FormData = {
  businessName: string;
  abn: string;
  businessAddress: string;
  ownerName: string;
  businessPhone: string;
  businessEmail: string;
  services: string[];
  suburbsCovered: string;
  colourScheme: string;
  googleLink: string;
  notes: string;
  referralSource: string;
};

const emptyForm: FormData = {
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
  data: FormData,
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
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentFormStep = FORM_STEPS[formStepIndex];
  const progress = phase === "form" ? (formStepIndex / FORM_STEPS.length) * 100 : 100;

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
                <StepContent
                  key={currentFormStep}
                  step={currentFormStep}
                  formData={formData}
                  setFormData={setFormData}
                  onNext={goNext}
                  onBack={goBack}
                  isFirstStep={formStepIndex === 0}
                  isLastStep={formStepIndex === FORM_STEPS.length - 1}
                />
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

function StepContent({
  step,
  formData,
  setFormData,
  onNext,
  onBack,
  isFirstStep,
  isLastStep,
}: {
  step: FormStep;
  formData: FormData;
  setFormData: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}) {
  const update =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [field]: e.target.value });

  const toggleService = (service: string) => {
    setFormData({
      ...formData,
      services: formData.services.includes(service)
        ? formData.services.filter((s) => s !== service)
        : [...formData.services, service],
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const meta = STEP_META[step];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">{meta.eyebrow}</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        {meta.title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">{meta.description}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {step === "business" && (
          <>
            <FormField
              label="Business Name"
              required
              value={formData.businessName}
              onChange={update("businessName")}
              placeholder="Mate's Plumbing & Gas"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="ABN"
                optional
                value={formData.abn}
                onChange={update("abn")}
                placeholder="12 345 678 901"
              />
              <FormField
                label="Business Address"
                optional
                value={formData.businessAddress}
                onChange={update("businessAddress")}
                placeholder="1 Example St, Parramatta NSW"
              />
            </div>
          </>
        )}

        {step === "contact" && (
          <>
            <FormField
              label="Owner / Contact Name"
              required
              value={formData.ownerName}
              onChange={update("ownerName")}
              placeholder="Alex Mate"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Business Phone"
                type="tel"
                required
                value={formData.businessPhone}
                onChange={update("businessPhone")}
                placeholder="0400 000 000"
              />
              <FormField
                label="Business Email"
                type="email"
                required
                value={formData.businessEmail}
                onChange={update("businessEmail")}
                placeholder="you@business.com.au"
              />
            </div>
          </>
        )}

        {step === "services" && (
          <>
            <ServiceCheckboxes selected={formData.services} onToggle={toggleService} />
            <FormField
              label="Suburbs Covered"
              optional
              value={formData.suburbsCovered}
              onChange={update("suburbsCovered")}
              placeholder="Parramatta, Blacktown, Penrith"
            />
          </>
        )}

        {step === "brand" && (
          <>
            <BrandColorPicker
              value={formData.colourScheme}
              onChange={(name) => setFormData({ ...formData, colourScheme: name })}
            />
            <FormField
              label="Google Business Profile Link"
              optional
              value={formData.googleLink}
              onChange={update("googleLink")}
              placeholder="https://g.page/..."
            />
            <FormTextArea
              label="Anything else we should know?"
              optional
              value={formData.notes}
              onChange={update("notes")}
              placeholder="Tell us about your business..."
            />
            <FormField
              label="How did you hear about us?"
              optional
              value={formData.referralSource}
              onChange={update("referralSource")}
              placeholder="Google, referral, Facebook ad..."
            />
          </>
        )}

        <div className="mt-3 flex items-center gap-3">
          {!isFirstStep && (
            <button
              type="button"
              onClick={onBack}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "flex-1")}
          >
            {isLastStep ? "Continue to Payment" : "Continue"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function FormField({
  label,
  optional,
  ...props
}: {
  label: string;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {optional && <span className="ml-1 font-normal text-zinc-400">(optional)</span>}
      </span>
      <input
        {...props}
        className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
      />
    </label>
  );
}

function FormTextArea({
  label,
  optional,
  ...props
}: {
  label: string;
  optional?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {optional && <span className="ml-1 font-normal text-zinc-400">(optional)</span>}
      </span>
      <textarea
        {...props}
        rows={3}
        className="resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
      />
    </label>
  );
}

function ServiceCheckboxes({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (service: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">Services Offered</span>
      <div className="grid grid-cols-2 gap-2.5">
        {SERVICE_OPTIONS.map((service) => {
          const isSelected = selected.includes(service);
          return (
            <button
              key={service}
              type="button"
              onClick={() => onToggle(service)}
              aria-pressed={isSelected}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                isSelected
                  ? "border-blue-500 bg-blue-50/50 text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 hover:bg-blue-50/30",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 bg-white",
                )}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              {service}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Same six named colour schemes as PreviewRequestFlow's picker (both read
 * from the shared src/lib/colorSchemes.ts so the hex values can't drift) —
 * duplicated here as its own compact UI rather than imported, since it
 * isn't exported as a shared component today.
 */
function BrandColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">Brand Colours</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {COLOR_SCHEMES.map((scheme) => {
          const selected = scheme.name === value;
          return (
            <button
              key={scheme.name}
              type="button"
              onClick={() => onChange(scheme.name)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-center gap-2.5 rounded-xl border px-2.5 py-4 text-center transition-colors",
                selected
                  ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                  : "border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/30",
              )}
            >
              <span className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-zinc-200">
                <span className="h-full w-1/2" style={{ backgroundColor: scheme.primaryColor }} />
                <span className="h-full w-1/2" style={{ backgroundColor: scheme.secondaryColor }} />
                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-tight font-medium",
                  selected ? "text-zinc-900" : "text-zinc-600",
                )}
              >
                {scheme.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col items-center gap-4 py-6 text-center"
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Setting up your account...
      </h1>
      <p className="max-w-xs text-sm text-zinc-500">
        We&apos;re taking you to secure payment to start your 30-day free trial.
      </p>
    </motion.div>
  );
}

function StepError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="py-2 text-center"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"
      >
        <AlertCircle className="h-7 w-7" />
      </motion.span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        Something went wrong.
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-zinc-500">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-8")}
      >
        Try Again
      </button>
    </motion.div>
  );
}
