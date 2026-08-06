"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"
      >
        <AlertCircle className="h-7 w-7" />
      </motion.span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        Something went wrong.
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-zinc-500">{message}</p>

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
