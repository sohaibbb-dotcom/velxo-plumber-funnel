"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { TrialReassurance } from "@/components/onboarding/TrialReassurance";
import type { Plan } from "@/lib/plans";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Step 4 — the financial-commitment screen. Deliberately the ONLY place in
 * the redesigned flow the trial terms are shown in full, after the prospect
 * has already seen their personalized result and provided their details.
 * Clicking "Continue to Secure Checkout" is what actually triggers
 * submitMinimalOnboarding (unchanged) — this component never talks to the
 * API directly, it only renders and hands control back up via onSubmit.
 */
export function CommitmentStep({
  plan,
  isSubmitting,
  onBack,
  onSubmit,
}: {
  plan: Plan;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="w-full max-w-lg"
    >
      <div className="text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          You&apos;re ready to start
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/55">
          Here&apos;s exactly what happens next.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
        <TrialReassurance plan={plan} />

        <ul className="mt-5 flex flex-col gap-2.5 text-[14px] text-white/70">
          <li>• Card required to start your trial</li>
          <li>• Cancel before your trial ends and pay nothing</li>
          <li>• No long-term contract</li>
        </ul>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Setting up…" : "Continue to Secure Checkout →"}
        </button>
        <p className="mt-3 text-center text-xs text-white/35">
          No charge today · Card required · Cancel anytime
        </p>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/40 transition-colors hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
    </motion.div>
  );
}
