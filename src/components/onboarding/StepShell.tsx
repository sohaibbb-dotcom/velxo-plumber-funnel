"use client";

import { FormEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
      <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">{eyebrow}</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">{description}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {children}

        <div className="mt-3 flex items-center gap-3">
          {!isFirstStep && (
            <button
              type="button"
              onClick={onBack}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "flex-1")}
          >
            {submitLabel}
          </button>
        </div>
        {submitCaption && (
          <p className="text-center text-xs text-zinc-400">{submitCaption}</p>
        )}
      </form>
    </motion.div>
  );
}
