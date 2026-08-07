"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const CHECKLIST = [
  "Verify your business",
  "Reserve your dedicated AI phone number",
  "Configure your AI Receptionist",
  "Start your 30-day free trial",
];

export function IntroTransition({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-md"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">
          Let&apos;s build your AI Receptionist.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">In the next few minutes we&apos;ll:</p>

        <ul className="mt-6 flex flex-col gap-3 text-left">
          {CHECKLIST.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.15 + i * 0.08 }}
              className="flex items-center gap-3 text-[15px] font-medium text-zinc-800"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {item}
            </motion.li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-zinc-400">This only takes around 3 minutes.</p>

        <motion.button
          type="button"
          onClick={onStart}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.15 + CHECKLIST.length * 0.08 + 0.1 }}
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-8 w-full sm:w-auto")}
        >
          Start Setup →
        </motion.button>
      </motion.div>
    </div>
  );
}
