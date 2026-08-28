"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FormField } from "@/components/onboarding/FormField";

const EASE = [0.16, 1, 0.3, 1] as const;

const currencyFormat = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

export type BusinessDetails = {
  businessName: string;
  ownerName: string;
  businessPhone: string;
  businessEmail: string;
};

/**
 * Step 3 of the redesigned flow — deliberately visually lighter than the old
 * single-screen form: no pricing box, no "Continue to Secure Checkout"
 * language here. The trial terms are introduced on the next step
 * (CommitmentStep) instead, after the prospect has already committed to
 * providing their details. Carries forward a small, muted reminder of the
 * calculator's monthly opportunity value — deliberately far less visually
 * dominant than the ResultStep treatment, just enough to preserve context
 * rather than feeling like a disconnected lead-capture form.
 */
export function DetailsStep({
  values,
  monthlyOpportunity,
  onChange,
  onStart,
  onBack,
  onContinue,
}: {
  values: BusinessDetails;
  monthlyOpportunity: number;
  onChange: (values: BusinessDetails) => void;
  /** Fires once, on the first interaction with any of the four fields. */
  onStart: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  // Ref check inlined directly in each event handler (not a shared helper)
  // so React's eslint rules can unambiguously see it's only ever read/
  // written from an event handler, never during render.
  const hasStartedRef = useRef(false);

  const update =
    (field: keyof BusinessDetails) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        onStart();
      }
      onChange({ ...values, [field]: e.target.value });
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="w-full max-w-lg"
    >
      <div className="text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3.5 py-1.5">
          <span className="text-[11px] font-medium tracking-wide text-white/50 uppercase">
            Your missed-call opportunity
          </span>
          <span className="text-[13px] font-semibold text-amber-300">
            {currencyFormat.format(monthlyOpportunity)}/month
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Turn your missed calls into conversations.
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
      >
        <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">
          Where should Velxo work for you?
        </p>

        <FormField
          label="Business Name"
          required
          autoComplete="organization"
          value={values.businessName}
          onChange={update("businessName")}
          placeholder="Mate's Plumbing & Gas Pty Ltd"
        />
        <FormField
          label="Owner / Contact Name"
          required
          autoComplete="name"
          value={values.ownerName}
          onChange={update("ownerName")}
          placeholder="Alex Mate"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Business Phone"
            type="tel"
            required
            autoComplete="tel"
            value={values.businessPhone}
            onChange={update("businessPhone")}
            placeholder="0400 000 000"
          />
          <FormField
            label="Business Email"
            type="email"
            required
            autoComplete="email"
            value={values.businessEmail}
            onChange={update("businessEmail")}
            placeholder="you@business.com.au"
          />
        </div>

        <button
          type="submit"
          className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-center text-xs text-white/35">30 days free • A$0 today</p>
      </form>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
    </motion.div>
  );
}
