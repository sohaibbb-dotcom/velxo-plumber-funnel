"use client";

import { ComponentType, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  CalendarCheck,
  Check,
  ChevronDown,
  Loader2,
  Globe,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME } from "@/lib/colorSchemes";
import { trackMetaPixelEvent } from "@/lib/metaPixel";
import { captureAttributionFromUrl, getStoredAttribution } from "@/lib/attribution";

const EASE = [0.16, 1, 0.3, 1] as const;

type Step = "form" | "loading" | "error";

type FormData = {
  businessName: string;
  contactName: string;
  suburb: string;
  phone: string;
  email: string;
  website: string;
  service: string;
  colorScheme: string;
  /** Honeypot — must stay empty. Real users never see this field. */
  companyWebsite: string;
};

const emptyForm: FormData = {
  businessName: "",
  contactName: "",
  suburb: "",
  phone: "",
  email: "",
  website: "",
  service: "",
  colorScheme: DEFAULT_COLOR_SCHEME.name,
  companyWebsite: "",
};

const services = [
  "General Plumbing",
  "Emergency Repairs",
  "Hot Water Systems",
  "Drain Cleaning",
  "Gas Fitting",
  "Bathroom Renovations",
  "Other",
];

const stages: { label: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: "Website", icon: Globe },
  { label: "AI Receptionist", icon: Bot },
  { label: "Booking System", icon: CalendarCheck },
  { label: "Automation", icon: Zap },
  { label: "Ready", icon: Sparkles },
];

const STAGE_DELAY = 600;
const GENERIC_ERROR = "We couldn't save your request. Please try again.";
const MISSING_URL_ERROR =
  "Your preview was saved, but we couldn't load your link. Please try again.";

type SubmitResult =
  | { success: true; previewUrl: string | undefined }
  | { success: false; error: string };

async function submitPreviewRequest(data: FormData): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/preview-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: data.businessName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        suburb: data.suburb,
        primaryService: data.service,
        website: data.website,
        colorScheme: data.colorScheme,
        honeypot: data.companyWebsite,
        attribution: getStoredAttribution(),
      }),
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok || !payload?.success) {
      const message =
        typeof payload?.error === "string" && payload.error.length > 0
          ? payload.error
          : GENERIC_ERROR;
      return { success: false, error: message };
    }

    return { success: true, previewUrl: payload.previewUrl };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

export function PreviewRequestFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = step === "form" ? 33 : step === "loading" ? 100 : 66;

  // Captured once, on landing — before anything else can drop the ad's
  // query params. Read back at submit time via getStoredAttribution().
  useEffect(() => {
    captureAttributionFromUrl();
  }, []);

  const handleFormSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStep("loading");

    submitPreviewRequest(formData).then((result) => {
      if (!result.success) {
        setErrorMessage(result.error);
        setStep("error");
        setIsSubmitting(false);
        return;
      }

      if (!result.previewUrl) {
        setErrorMessage(MISSING_URL_ERROR);
        setStep("error");
        setIsSubmitting(false);
        return;
      }

      trackMetaPixelEvent("Lead");

      // Loading screen stays visible until the new route takes over —
      // no separate "success" step, no artificial wait.
      router.push(result.previewUrl);
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[480px] w-[780px] rounded-full bg-gradient-to-tr from-blue-100 via-sky-50 to-transparent opacity-70 blur-3xl" />
      </div>

      <header className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Wrench className="h-3.5 w-3.5" />
          </span>
          {siteConfig.name}
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] sm:p-10">
            <AnimatePresence mode="wait">
              {step === "form" && (
                <StepForm
                  key="form"
                  formData={formData}
                  setFormData={setFormData}
                  isSubmitting={isSubmitting}
                  onSubmit={handleFormSubmit}
                />
              )}
              {step === "loading" && <StepLoading key="loading" />}
              {step === "error" && (
                <StepError
                  key="error"
                  message={errorMessage}
                  onRetry={() => setStep("form")}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function StepForm({
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const update = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">
        Preview Request
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        See Your Plumbing Business Before You Buy
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">
        We&apos;ll build a personalised preview showing how your plumbing
        business could look and work with Velxo.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Business Name"
            type="text"
            required
            value={formData.businessName}
            onChange={update("businessName")}
            placeholder="Mate's Plumbing & Gas"
          />
          <FormField
            label="Contact Name"
            type="text"
            required
            value={formData.contactName}
            onChange={update("contactName")}
            placeholder="Alex Mate"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Suburb"
            type="text"
            required
            value={formData.suburb}
            onChange={update("suburb")}
            placeholder="Parramatta, NSW"
          />
          <FormField
            label="Phone Number"
            type="tel"
            required
            value={formData.phone}
            onChange={update("phone")}
            placeholder="0400 000 000"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={update("email")}
            placeholder="you@business.com.au"
          />
          <FormField
            label="Website"
            optional
            type="text"
            value={formData.website}
            onChange={update("website")}
            placeholder="yourbusiness.com.au"
          />
        </div>
        <FormSelect
          label="Primary Service"
          required
          value={formData.service}
          onChange={update("service")}
          options={services}
        />

        <BrandColorPicker
          value={formData.colorScheme}
          onChange={(name) => setFormData({ ...formData, colorScheme: name })}
        />

        {/* Honeypot — hidden from real users, left empty by them. Bots that
            auto-fill every field will populate it, and the API rejects it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden opacity-0"
        >
          <label>
            Company Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={formData.companyWebsite}
              onChange={update("companyWebsite")}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            buttonVariants({ variant: "primary", size: "lg" }),
            "mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSubmitting ? "Building My Preview…" : "Build My Preview"}
        </button>
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

function FormSelect({
  label,
  options,
  ...props
}: {
  label: string;
  options: string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <select
        {...props}
        className={cn(
          "h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15",
          props.value ? "text-zinc-900" : "text-zinc-400",
        )}
      >
        <option value="" disabled>
          Select a service
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="text-zinc-900">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Ported from the real onboarding flow's colour-scheme picker (same six
 * named options, same hex values, same split-circle swatch + checkmark
 * interaction). The card chrome (border/background/hover/selected states)
 * is adapted to this form's light theme instead of the onboarding flow's
 * dark theme — the source's own near-transparent white-tinted borders are
 * only legible against a dark background — but the swatches, layout, and
 * selection behaviour are unchanged.
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
      <span className="text-sm font-medium text-zinc-700">
        Brand Colours <span className="text-red-500">*</span>
      </span>
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
                <span
                  className="h-full w-1/2"
                  style={{ backgroundColor: scheme.primaryColor }}
                />
                <span
                  className="h-full w-1/2"
                  style={{ backgroundColor: scheme.secondaryColor }}
                />
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
      <p className="mt-1.5 text-xs text-zinc-400">
        Don&apos;t see your colours? We match any brand palette exactly.
      </p>
    </div>
  );
}

/**
 * Purely decorative — cycles through stages on its own interval and holds
 * at the final one. It has no completion callback: the parent redirects
 * as soon as the real API call resolves, whatever stage this happens to be
 * showing at that moment. This is intentionally not tied to a fixed total
 * duration.
 */
function StepLoading() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((s) => (s < stages.length ? s + 1 : s));
    }, STAGE_DELAY);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="py-2 text-center"
    >
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Building Your Preview...
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        This only takes a few seconds.
      </p>

      <div className="mx-auto mt-8 max-w-xs">
        {stages.map((stage, i) => (
          <div key={stage.label}>
            {i > 0 && (
              <div className="flex justify-center py-1">
                <ChevronDown className="h-4 w-4 text-zinc-300" />
              </div>
            )}
            <StageRow
              icon={stage.icon}
              label={stage.label}
              status={
                i < activeStage ? "done" : i === activeStage ? "active" : "pending"
              }
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StageRow({
  icon: Icon,
  label,
  status,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  status: "done" | "active" | "pending";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-300",
        status === "pending"
          ? "border-zinc-100 bg-white"
          : "border-blue-100 bg-blue-50/40",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          status === "done"
            ? "bg-emerald-500 text-white"
            : status === "active"
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-400",
        )}
      >
        {status === "done" ? (
          <motion.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 16 }}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.span>
        ) : status === "active" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </span>
      <span
        className={cn(
          "text-sm font-medium",
          status === "pending" ? "text-zinc-400" : "text-zinc-900",
        )}
      >
        {label}
      </span>
    </div>
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
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-zinc-500">
        {message}
      </p>

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
