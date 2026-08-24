"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TRIAL_CTA_HREF } from "@/lib/routes";
import { HeroProductDemo } from "@/components/sections/HeroProductDemo";
import { trackFunnelEvent } from "@/lib/analytics/events";

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
    <section className="relative overflow-hidden bg-zinc-950 pt-3 pb-6 sm:pt-[calc(var(--nav-h)+2rem)] sm:pb-14 lg:pt-[calc(var(--nav-h)+2rem)] lg:pb-16 xl:pb-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center"
      >
        <div className="h-[480px] w-[820px] rounded-full bg-gradient-to-br from-violet-600/25 via-blue-600/10 to-transparent opacity-80 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[420px_1fr] lg:items-center lg:gap-8 xl:gap-8">
          <div className="text-center lg:text-left">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="mb-2 flex justify-center sm:mb-5 lg:justify-start"
            >
              <Badge>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                AI Receptionist for Plumbers
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
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-[3.4rem] xl:text-6xl">
              Never Miss Another
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                $450
              </span>{" "}
              Job.
            </h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="mx-auto mt-2 max-w-md text-base leading-relaxed text-white/60 sm:mt-5 sm:text-lg lg:mx-0"
            >
              Velxo&apos;s AI Receptionist responds to missed calls, talks to
              customers, and books jobs automatically.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
              className="mt-3 flex flex-col items-center justify-center gap-3 sm:mt-7 sm:flex-row lg:justify-start"
            >
              <a
                href={TRIAL_CTA_HREF}
                onClick={() =>
                  trackFunnelEvent("PrimaryCTAClick", {
                    plan: "ai_receptionist",
                    location: "hero",
                    destination: TRIAL_CTA_HREF,
                  })
                }
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/40 transition-all duration-200 hover:from-violet-500 hover:to-blue-500 hover:shadow-violet-500/25 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
              >
                Start My 30-Day Free Trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </motion.div>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={4}
              variants={fadeUp}
              className="mt-1.5 text-[10px] leading-snug font-medium text-white/50 sm:mt-4 sm:text-xs sm:leading-relaxed sm:text-white/60"
            >
              30 days free · Then A$297/month · No charge today · Cancel anytime
              before your trial ends
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            className="relative mt-2 lg:mt-0"
          >
            <HeroProductDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
