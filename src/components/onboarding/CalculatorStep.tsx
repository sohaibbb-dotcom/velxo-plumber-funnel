"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, PhoneCall } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export type CalculatorValues = {
  incomingCalls: number;
  missedCalls: number;
  avgJobValue: number;
};

/** Parses a raw text input into a finite non-negative number, or null if not yet valid. */
function parsePositiveNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function CalculatorStep({
  initialValues,
  onStart,
  onComplete,
}: {
  /**
   * Last successfully-calculated values, if any — seeds the fields when the
   * visitor navigates back from the result screen via "Recalculate", so
   * that action doesn't wipe what they already typed. This component is
   * fully unmounted/remounted on phase change (AnimatePresence), so its own
   * useState alone can't survive that; OnboardingFlow passes this back in.
   */
  initialValues?: CalculatorValues | null;
  /** Fires once, on the first interaction with any of the three inputs. */
  onStart: () => void;
  /** Fires when the visitor submits a valid set of values. */
  onComplete: (values: CalculatorValues) => void;
}) {
  const [incomingRaw, setIncomingRaw] = useState(initialValues ? String(initialValues.incomingCalls) : "");
  const [missedRaw, setMissedRaw] = useState(initialValues ? String(initialValues.missedCalls) : "");
  const [jobValueRaw, setJobValueRaw] = useState(initialValues ? String(initialValues.avgJobValue) : "");
  const [missedTouched, setMissedTouched] = useState(Boolean(initialValues));
  // Fires once, on the first interaction with ANY of the three fields — the
  // ref check is inlined directly in each onChange (rather than a shared
  // helper function) so React's eslint rules can unambiguously see it's only
  // ever read/written from an event handler, never during render.
  const hasStartedRef = useRef(false);

  const incoming = parsePositiveNumber(incomingRaw);
  const missed = parsePositiveNumber(missedRaw);
  const jobValue = parsePositiveNumber(jobValueRaw);

  const missedExceedsIncoming = incoming !== null && missed !== null && missed > incoming;
  const missedPercent =
    incoming !== null && incoming > 0 && missed !== null && !missedExceedsIncoming
      ? Math.round((missed / incoming) * 100)
      : null;

  const isValid =
    incoming !== null &&
    incoming > 0 &&
    missed !== null &&
    !missedExceedsIncoming &&
    jobValue !== null &&
    jobValue > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || incoming === null || missed === null || jobValue === null) return;
    onComplete({ incomingCalls: incoming, missedCalls: missed, avgJobValue: jobValue });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="w-full max-w-xl"
    >
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white">
        <PhoneCall className="h-5 w-5" />
      </div>

      <h1 className="mt-5 text-center text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
        Let&apos;s see how much missed calls could be costing your business.
      </h1>

      <p className="mx-auto mt-4 max-w-md text-center text-[15px] leading-relaxed text-white/60">
        Most businesses don&apos;t realise how much opportunity can slip through unanswered
        calls — especially while they&apos;re on jobs, driving or helping another customer.
      </p>

      <div className="mx-auto mt-5 flex w-fit flex-col items-center gap-1 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-3.5 text-center">
        <span className="text-[11px] font-semibold tracking-widest text-amber-300/80 uppercase">
          Industry estimates
        </span>
        <span className="text-[15px] font-semibold text-white">
          20–30% of incoming calls can go unanswered
        </span>
      </div>

      <p className="mx-auto mt-5 max-w-md text-center text-[15px] font-medium leading-relaxed text-white/85">
        But your business is what matters. Let&apos;s calculate what that could look like for
        yours.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
      >
        <CalcField
          label="How many new-customer calls do you receive in a typical week?"
          value={incomingRaw}
          placeholder="25"
          onChange={(v) => {
            if (!hasStartedRef.current) {
              hasStartedRef.current = true;
              onStart();
            }
            setIncomingRaw(v);
          }}
        />
        <div>
          <CalcField
            label="About how many of those calls do you miss?"
            value={missedRaw}
            placeholder="5"
            onChange={(v) => {
              if (!hasStartedRef.current) {
                hasStartedRef.current = true;
                onStart();
              }
              setMissedTouched(true);
              setMissedRaw(v);
            }}
          />
          {missedExceedsIncoming ? (
            <p className="mt-1.5 text-[13px] text-amber-400">
              Can&apos;t be more than your incoming calls.
            </p>
          ) : missedPercent !== null ? (
            <p className="mt-1.5 text-[13px] text-violet-300">
              That&apos;s about {missedPercent}% of your incoming opportunities.
            </p>
          ) : missedTouched && incoming === 0 ? (
            <p className="mt-1.5 text-[13px] text-white/35">
              Enter how many calls you receive first.
            </p>
          ) : null}
        </div>
        <CalcField
          label="What's your average job worth?"
          value={jobValueRaw}
          placeholder="450"
          prefix="A$"
          decimal
          onChange={(v) => {
            if (!hasStartedRef.current) {
              hasStartedRef.current = true;
              onStart();
            }
            setJobValueRaw(v);
          }}
        />

        <button
          type="submit"
          disabled={!isValid}
          className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-violet-600 disabled:hover:to-blue-600"
        >
          Calculate My Missed-Call Value
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
}

function CalcField({
  label,
  value,
  placeholder,
  onChange,
  prefix,
  decimal,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  prefix?: string;
  decimal?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-white/75">{label}</span>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-white/40">
            {prefix}
          </span>
        ) : null}
        <input
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            const next = e.target.value;
            // Only ever allow digits (and one decimal point for currency) —
            // rejects negatives and non-numeric characters at the source
            // rather than trying to sanitize/parse a free-form string later.
            const pattern = decimal ? /^\d*\.?\d*$/ : /^\d*$/;
            if (pattern.test(next)) onChange(next);
          }}
          className={`h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-400/20 ${
            prefix ? "pr-3.5 pl-8" : "px-3.5"
          }`}
        />
      </div>
    </label>
  );
}
