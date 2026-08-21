"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function StepLoading({
  title = "Setting up your account...",
  message = "We're taking you to Stripe's secure checkout to start your 30-day free trial.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col items-center gap-4 py-6 text-center"
    >
      <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="max-w-xs text-sm text-white/50">{message}</p>
    </motion.div>
  );
}
