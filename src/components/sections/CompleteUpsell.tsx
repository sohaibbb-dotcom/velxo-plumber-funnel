"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CompleteUpsell() {
  return (
    <section className="bg-white pb-20 sm:pb-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col items-center gap-5 rounded-2xl border border-zinc-200 bg-zinc-50/60 px-6 py-6 text-center sm:flex-row sm:justify-between sm:px-8 sm:text-left"
        >
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Need the complete system?
            </p>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-zinc-500">
              Velxo Complete combines the AI Receptionist with a high-converting
              website and the complete automation system.
            </p>
          </div>
          <a
            href="#complete"
            className={buttonVariants({
              variant: "secondary",
              size: "md",
              className: "shrink-0 whitespace-nowrap",
            })}
          >
            Explore Velxo Complete
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
