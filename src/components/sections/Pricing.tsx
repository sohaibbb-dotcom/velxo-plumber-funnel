"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Globe } from "lucide-react";
import { PLAN_MONTHLY_PRICE_AUD } from "@/lib/plans";
import { PREVIEW_FORM_PATH, TRIAL_CTA_HREF } from "@/lib/routes";

const EASE = [0.16, 1, 0.3, 1] as const;

const receptionistFeatures = [
  "AI Missed Call Replies",
  "AI Booking Assistant",
  "SMS Conversations",
  "Google Review Requests",
  "CRM",
  "Automated Follow-Ups",
  "Sales Pipeline",
  "AI Automations",
];

const completeAdditions = [
  "A custom website for your business",
  "Logo, brand colours & photos handled for you",
];

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-20 bg-zinc-950 py-14 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">
            Pricing &amp; Plans
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl md:text-5xl">
            Two ways to work with Velxo.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-white/50 sm:text-lg">
            Both start with a 30-day free trial. $0 today — cancel before it ends and pay nothing.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:mt-14 lg:grid-cols-2">
          {/* AI Receptionist — the focused, lowest-friction entry point */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
          >
            <p className="text-[13px] font-medium text-white/45">Just need the AI system?</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Velxo AI Receptionist
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-white/55">
              Stop losing jobs from missed calls.
            </p>

            <PriceBlock price={PLAN_MONTHLY_PRICE_AUD.ai_receptionist} />

            <ul className="mt-7 grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {receptionistFeatures.map((item, i) => (
                <ChecklistItem key={item} label={item} delay={i * 0.05} />
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-center gap-3">
              <a
                href={TRIAL_CTA_HREF}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/40 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
              >
                Start My 30-Day Free Trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <p className="text-center text-xs text-white/40">
                Cancel before your trial ends and pay nothing. Most setups are ready within 1 business day.
              </p>
            </div>
          </motion.div>

          {/* Velxo Complete — the natural upgrade for a business that also needs a website */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            className="relative flex flex-col overflow-hidden rounded-3xl border border-violet-400/25 bg-gradient-to-b from-violet-500/[0.07] via-white/[0.03] to-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 right-0 h-52 w-64 rounded-full bg-gradient-to-br from-violet-600/20 to-blue-600/10 blur-3xl"
            />

            <p className="relative text-[13px] font-medium text-violet-200/70">
              Need the whole customer-conversion setup?
            </p>
            <h3 className="relative mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Velxo Complete
              <Globe className="h-5 w-5 text-violet-300" />
            </h3>
            <p className="relative mt-2 text-[15px] leading-relaxed text-white/55">
              Your full customer-conversion system — everything in AI Receptionist, plus your website.
            </p>

            <div className="relative">
              <PriceBlock price={PLAN_MONTHLY_PRICE_AUD.complete} />
            </div>

            <div className="relative mt-7 flex flex-1 flex-col gap-3">
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] font-medium text-white/70">
                <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                Everything in AI Receptionist
              </div>
              <ul className="flex flex-col gap-3">
                {completeAdditions.map((item, i) => (
                  <ChecklistItem key={item} label={item} delay={i * 0.05} />
                ))}
              </ul>
            </div>

            <div className="relative mt-8 flex flex-col items-center gap-3">
              <a
                href={PREVIEW_FORM_PATH}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/40 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
              >
                See My Business Preview
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <p className="text-center text-xs text-white/40">
                Cancel before your trial ends and pay nothing.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** Shared trial/price block: the offer reads in one glance, ongoing price never shrunk into microcopy. */
function PriceBlock({ price }: { price: number }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-[11px] font-semibold tracking-widest text-white/45 uppercase">Your Offer</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        30 Days{" "}
        <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
          Free
        </span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
          $0 today
        </span>
        <span className="text-[15px] font-medium text-white/65">then A${price}/month after your trial</span>
      </div>
    </div>
  );
}

function ChecklistItem({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35, ease: EASE }}
      className="flex items-center gap-2.5"
    >
      <motion.span
        initial={{ scale: 0, rotate: -45 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.08, type: "spring", stiffness: 320, damping: 16 }}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400"
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </motion.span>
      <span className="text-[14px] text-white/80">{label}</span>
    </motion.li>
  );
}
