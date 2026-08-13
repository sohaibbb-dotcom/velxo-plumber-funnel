"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { TRIAL_CTA_HREF } from "@/lib/routes";
import { HeroProductDemo } from "@/components/sections/HeroProductDemo";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: EASE },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-[calc(var(--nav-h)+1.25rem)] pb-24 sm:pt-[calc(var(--nav-h)+2.5rem)] sm:pb-32 lg:pt-[calc(var(--nav-h)+3.5rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center"
      >
        <div className="h-[480px] w-[780px] rounded-full bg-gradient-to-tr from-blue-100 via-sky-50 to-transparent opacity-70 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="mb-6 flex justify-center"
        >
          <Badge>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Built for Australian plumbers
          </Badge>
        </motion.div>

        {/*
          Not a motion.h1: this is the LCP element. Framer Motion's
          initial="hidden" (and even a CSS entrance animation starting from
          opacity:0) bakes a transparent initial state into the SSR HTML,
          which keeps this element ineligible for LCP paint until that state
          resolves. It renders in its final visual state with no animation
          so it's paintable immediately, with no hydration or CSS-animation
          dependency.
        */}
        <h1 className="text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl md:text-6xl">
          Stop Losing Jobs
          <br />
          While You&apos;re{" "}
          <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
            On The Tools
          </span>
        </h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg"
        >
          Velxo&apos;s AI Receptionist responds to missed calls, talks to
          customers, and books jobs automatically.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href={TRIAL_CTA_HREF}
            className={buttonVariants({
              variant: "primary",
              size: "lg",
              className: "group w-full sm:w-auto",
            })}
          >
            Start My Free 30-Day Trial
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
          className="mt-4 text-xs font-medium text-zinc-400"
        >
          30 days free · Then A$297/month · No charge today · Cancel anytime
          before your trial ends
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        className="relative mx-auto mt-16 max-w-6xl px-4 sm:mt-20 sm:px-6 lg:px-8"
      >
        <HeroProductDemo />
      </motion.div>
    </section>
  );
}
