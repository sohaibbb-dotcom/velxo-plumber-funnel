"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TRIAL_CTA_HREF } from "@/lib/routes";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The page's true closer: by this point the visitor has seen the product,
 * the workflow, personalised the cost of missed calls, seen what's
 * included, seen the price, and had objections answered — this is the
 * obvious-next-step moment, not another generic repeat of the hero.
 */
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      >
        <div className="h-[420px] w-[760px] rounded-full bg-gradient-to-br from-violet-600/25 via-blue-600/15 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl md:text-5xl"
        >
          The next call you miss could be your next{" "}
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            $450 job
          </span>
          .
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="mt-8"
        >
          <a
            href={TRIAL_CTA_HREF}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet-950/40 transition-all duration-200 hover:from-violet-500 hover:to-blue-500 hover:shadow-violet-500/25"
          >
            Start My 30-Day Free Trial
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
          <p className="mx-auto mt-4 max-w-sm text-sm text-white/50">
            $0 today · A$297/month after 30 days · Cancel before your trial
            ends and pay nothing.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
