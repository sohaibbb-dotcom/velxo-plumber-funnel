"use client";

import { motion } from "framer-motion";
import { ArrowRight, PhoneMissed } from "lucide-react";
import type { CalculatorValues } from "@/components/onboarding/CalculatorStep";

const EASE = [0.16, 1, 0.3, 1] as const;

const currencyFormat = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

/**
 * The one dynamic comparison line the spec requires: how many additional
 * jobs at the prospect's OWN average job value would cover the plan's
 * monthly price. Never claims a single job covers it unless the maths
 * actually supports that (avgJobValue >= monthlyPrice). Split into
 * {emphasis, rest} — same exact wording as a single sentence, just rendered
 * as two spans so the "N extra A$X job(s)" phrase can be visually
 * strengthened without changing the copy itself.
 */
function buildComparisonParts(
  avgJobValue: number,
  monthlyPrice: number,
): { emphasis: string; rest: string } {
  const jobsNeeded = Math.max(1, Math.ceil(monthlyPrice / avgJobValue));
  const jobLabel = currencyFormat.format(avgJobValue);
  const priceLabel = currencyFormat.format(monthlyPrice);

  if (jobsNeeded === 1) {
    return {
      emphasis: `One extra ${jobLabel} job`,
      rest: ` already covers Velxo's ${priceLabel} monthly cost.`,
    };
  }
  return {
    emphasis: `${jobsNeeded} extra ${jobLabel} jobs`,
    rest: ` would already cover Velxo's ${priceLabel} monthly cost.`,
  };
}

export function ResultStep({
  values,
  monthlyPrice,
  onBack,
  onContinue,
}: {
  values: CalculatorValues;
  monthlyPrice: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const weekly = values.missedCalls * values.avgJobValue;
  const monthly = weekly * 4;
  const annual = weekly * 52;
  const comparison = buildComparisonParts(values.avgJobValue, monthlyPrice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="w-full max-w-xl"
    >
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <PhoneMissed className="h-5 w-5" />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.08] via-white/[0.03] to-white/[0.03] p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-amber-300 uppercase">
          Missed-Call Exposure
        </p>

        <div className="mt-4 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-medium text-white/60">{currencyFormat.format(weekly)}</span>
          <span className="text-[11px] font-semibold tracking-wide text-white/35 uppercase">/ week</span>
          <span className="text-white/20">·</span>
          <span className="text-[15px] font-medium text-white/60">≈ {currencyFormat.format(monthly)}</span>
          <span className="text-[11px] font-semibold tracking-wide text-white/35 uppercase">/ month</span>
        </div>

        <p className="mt-5 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-5xl leading-none font-bold tracking-tight text-transparent sm:text-6xl">
          {currencyFormat.format(annual)}
        </p>
        <p className="mt-2 text-xs font-semibold tracking-widest text-amber-300/70 uppercase">
          / year
        </p>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-white/60">
          in potential job value tied to missed calls
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
          <p className="text-sm font-medium text-white/80">You don&apos;t need to recover all of it.</p>
          <p className="mt-2 text-[15px] leading-relaxed text-white/60">
            <span className="font-semibold text-amber-300">{comparison.emphasis}</span>
            {comparison.rest}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
        >
          Stop Missing These Opportunities
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-white/35 transition-colors hover:text-white/60"
        >
          Recalculate
        </button>
      </div>
    </motion.div>
  );
}
