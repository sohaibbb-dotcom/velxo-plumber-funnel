"use client";

import { FormEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Shared chrome (eyebrow/title/description + Back/Continue) every wizard step renders inside. */
export function StepShell({
  eyebrow,
  title,
  description,
  onSubmit,
  onBack,
  isFirstStep,
  submitLabel = "Continue",
  submitCaption,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onSubmit: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  submitLabel?: string;
  submitCaption?: string;
  children: ReactNode;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">{eyebrow}</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/55">{description}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {children}

        <div className="mt-3 flex items-center gap-3">
          {!isFirstStep && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 text-[15px] font-medium text-white/80 transition-colors duration-200 hover:bg-white/[0.08]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <button
            type="submit"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
          >
            {submitLabel}
          </button>
        </div>
        {submitCaption && (
          <p className="text-center text-xs text-white/40">{submitCaption}</p>
        )}
      </form>
    </motion.div>
  );
}
