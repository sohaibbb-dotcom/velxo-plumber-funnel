"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRIAL_CTA_HREF } from "@/lib/routes";

const EASE = [0.16, 1, 0.3, 1] as const;
const WEEKS_PER_MONTH = 4.33;

const formatCalls = (n: number) => `${Math.round(n)}/week`;
const formatJobValue = (n: number) => `$${Math.round(n).toLocaleString()}`;
const formatPercent = (n: number) => `${Math.round(n)}%`;
const formatJobs = (n: number) => `${Math.round(n).toLocaleString()} jobs`;
const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function Calculator() {
  const [missedCalls, setMissedCalls] = useState(5);
  const [jobValue, setJobValue] = useState(450);
  const [conversion, setConversion] = useState(40);

  const missedJobsPerMonth = missedCalls * WEEKS_PER_MONTH * (conversion / 100);
  const revenuePerMonth = missedJobsPerMonth * jobValue;
  const revenuePerYear = revenuePerMonth * 12;

  return (
    <section id="calculator" className="relative scroll-mt-20 bg-zinc-950 py-14 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      >
        <div className="h-[360px] w-[640px] rounded-full bg-gradient-to-br from-violet-600/15 via-blue-600/10 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">
            Make It Personal
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl md:text-5xl">
            How much are missed calls costing your business?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-white/50 sm:text-lg">
            Move the sliders — this is based on your numbers, not ours.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl sm:mt-12"
        >
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            <div className="flex flex-col gap-8 border-white/[0.08] p-6 sm:p-8 lg:border-r">
              <SliderField
                label="Calls you miss each week"
                value={missedCalls}
                onChange={setMissedCalls}
                min={0}
                max={30}
                step={1}
                format={formatCalls}
                minLabel="0"
                maxLabel="30"
              />
              <SliderField
                label="Average value of one job"
                value={jobValue}
                onChange={setJobValue}
                min={150}
                max={2000}
                step={10}
                format={formatJobValue}
                minLabel="$150"
                maxLabel="$2,000"
              />
              <SliderField
                label="Missed callers who'd have booked"
                value={conversion}
                onChange={setConversion}
                min={10}
                max={80}
                step={1}
                format={formatPercent}
                minLabel="10%"
                maxLabel="80%"
              />
            </div>

            {/* The result is the payoff: one dominant emerald figure, two
                supporting numbers beneath it — not three equally-weighted
                tiles competing for attention. */}
            <div className="flex flex-col justify-center bg-white/[0.02] p-6 sm:p-8">
              <p className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                Estimated revenue lost / year
              </p>
              <p className="mt-2 text-4xl font-semibold tabular-nums text-emerald-400 sm:text-5xl">
                <AnimatedNumber value={revenuePerYear} formatter={formatCurrency} />
              </p>

              <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-6">
                <ResultRow
                  label="Missed jobs / month"
                  value={missedJobsPerMonth}
                  formatter={formatJobs}
                />
                <ResultRow
                  label="Revenue lost / month"
                  value={revenuePerMonth}
                  formatter={formatCurrency}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-t border-white/[0.08] px-6 py-4 sm:px-8">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
            <p className="text-[12px] leading-relaxed text-white/40">
              An estimate based on the numbers above — not a guarantee. Actual
              results depend on your business, enquiry quality and close rate.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="mx-auto mt-6 flex max-w-4xl flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-6 text-center sm:flex-row sm:justify-between sm:px-8 sm:text-left"
        >
          <p className="text-[15px] font-medium text-white/80">
            If recovering even part of this matters, Velxo is free to try for
            30 days.
          </p>
          <a
            href={TRIAL_CTA_HREF}
            className="group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500 sm:w-auto"
          >
            Start My 30-Day Free Trial
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  minLabel,
  maxLabel,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  minLabel: string;
  maxLabel: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const inputId = useId();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-white/70">
          {label}
        </label>
        <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
          <AnimatedNumber value={value} formatter={format} />
        </span>
      </div>

      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #8b5cf6 ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
        }}
        className={cn(
          "mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          "[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-violet-400",
          "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-black/40",
          "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150",
          "[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95",
          "[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:appearance-none",
          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-violet-400",
          "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md",
          "[&::-moz-range-track]:bg-transparent",
        )}
      />

      <div className="mt-1.5 flex justify-between text-[11px] text-white/30">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  formatter,
}: {
  label: string;
  value: number;
  formatter: (n: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[13px] font-medium text-white/50">{label}</p>
      <p className="text-base font-semibold tabular-nums text-white">
        <AnimatedNumber value={value} formatter={formatter} />
      </p>
    </div>
  );
}

function AnimatedNumber({
  value,
  formatter,
}: {
  value: number;
  formatter: (n: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    const duration = 450;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <>{formatter(display)}</>;
}
