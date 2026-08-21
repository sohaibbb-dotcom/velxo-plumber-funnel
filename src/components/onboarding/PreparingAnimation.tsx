"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const CHECKLIST = [
  "Creating your secure workspace",
  "Reserving your business phone number",
  "Preparing your AI configuration",
  "Almost ready...",
];

// Tightened slightly from the original pacing (was ~3.2s total) so the
// "premium momentum" beat doesn't read as a delay on a flow we want to feel
// fast — still deliberately paced, not instant.
const ITEM_INTERVAL_MS = 450;
const HOLD_BEFORE_DONE_MS = 450;

/**
 * Deliberately not a spinner or a percentage bar — nothing here claims to
 * measure real progress. It's a paced reveal meant to feel like momentum
 * building, not a status readout.
 */
export function PreparingAnimation({ onDone }: { onDone: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= CHECKLIST.length) {
      const doneTimer = setTimeout(onDone, HOLD_BEFORE_DONE_MS);
      return () => clearTimeout(doneTimer);
    }
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), ITEM_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [visibleCount, onDone]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Preparing your AI Receptionist...
        </h1>

        <ul className="mt-8 flex flex-col gap-4 text-left">
          {CHECKLIST.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -8 }}
              animate={i < visibleCount ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex items-center gap-3 text-[15px] font-medium text-white/85"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
