"use client";

import { ComponentType, useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Info, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const WEEKS_PER_MONTH = 4.33;

const formatCalls = (n: number) => `${Math.round(n)} calls/week`;
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
    <section id="calculator" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">
            Cost Calculator
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl md:text-5xl">
            How much are missed calls costing your business?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-zinc-500 sm:text-lg">
            Move the sliders to see what missed calls are really costing you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 p-6 shadow-2xl shadow-zinc-900/10 sm:p-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div className="flex flex-col gap-9">
              <SliderField
                label="How many calls do you miss each week?"
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
                label="Average value of one plumbing job"
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
                label="How many missed callers would have become customers?"
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

            <div className="flex flex-col gap-4">
              <ResultTile
                label="Estimated missed jobs / month"
                value={missedJobsPerMonth}
                formatter={formatJobs}
                icon={Briefcase}
              />
              <ResultTile
                label="Estimated potential revenue / month"
                value={revenuePerMonth}
                formatter={formatCurrency}
                icon={TrendingUp}
              />
              <ResultTile
                label="Estimated potential revenue / year"
                value={revenuePerYear}
                formatter={formatCurrency}
                icon={Sparkles}
                emphasized
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="mx-auto mt-6 flex max-w-4xl items-start gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <p className="text-[13px] leading-relaxed text-zinc-500">
            This is only an estimate — actual results depend on your business,
            enquiry quality and conversion rate.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
          className="mx-auto mt-4 max-w-4xl rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-6 text-center shadow-lg shadow-blue-600/20 sm:px-10 sm:py-7"
        >
          <p className="text-base font-semibold text-balance text-white sm:text-lg">
            Recovering just one extra plumbing job each month could often cover
            the cost of Velxo.
          </p>
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
        <label htmlFor={inputId} className="text-sm font-medium text-white/80">
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
          background: `linear-gradient(to right, #3b82f6 ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
        }}
        className={cn(
          "mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
          "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500",
          "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-black/20",
          "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150",
          "[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95",
          "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none",
          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500",
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

function ResultTile({
  label,
  value,
  formatter,
  icon: Icon,
  emphasized,
}: {
  label: string;
  value: number;
  formatter: (n: number) => string;
  icon: ComponentType<{ className?: string }>;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-2xl border p-5",
        emphasized
          ? "border-blue-400/30 bg-blue-500/10"
          : "border-white/10 bg-white/[0.04]",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            emphasized ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-white/60",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[13px] leading-snug font-medium text-white/50">{label}</p>
      </div>
      <p
        className={cn(
          "mt-3 font-semibold tabular-nums text-white",
          emphasized ? "text-3xl sm:text-4xl" : "text-2xl",
        )}
      >
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
