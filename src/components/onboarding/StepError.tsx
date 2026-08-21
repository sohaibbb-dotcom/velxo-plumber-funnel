"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function StepError({ message, onRetry }: { message: string; onRetry: () => void }) {
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
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400"
      >
        <AlertCircle className="h-7 w-7" />
      </motion.span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
        Something went wrong.
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-white/55">{message}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-white/35">
        Nothing you&apos;ve entered has been lost — you can try again.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
      >
        Try Again
      </button>
    </motion.div>
  );
}
