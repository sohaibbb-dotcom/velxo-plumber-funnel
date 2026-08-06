"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Rocket } from "lucide-react";
import Link from "next/link";
import { PREVIEW_FORM_PATH, TRIAL_CTA_HREF } from "@/lib/routes";

const EASE = [0.16, 1, 0.3, 1] as const;

const TRUST_LINE =
  "30 days free · Then A$297/month · No charge today · Cancel anytime before your trial ends";

const COMPLETE_TRUST_LINE =
  "30 days free · Then A$397/month · No charge today · Cancel anytime before your trial ends · No setup fee";

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

const completeFeatures = [
  "Everything in AI Receptionist",
  "AI Website",
  "SEO",
  "Lead Capture",
  "Business Preview",
  "Conversion Optimisation",
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">
            Pricing &amp; Offer
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl md:text-5xl">
            Two ways to work with Velxo.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-zinc-500 sm:text-lg">
            Start with Velxo AI Receptionist. Add a website, SEO and lead capture
            whenever you want the full package.
          </p>
        </motion.div>

        {/* Two package cards */}
        <div className="mt-16 grid items-start gap-6 lg:grid-cols-2">
          {/* Package 1 — dominant */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-zinc-900/20 sm:p-9"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[420px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl"
            />

            <span className="relative inline-flex w-fit items-center rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-blue-300 uppercase">
              Start Here
            </span>

            <h3 className="relative mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Velxo AI Receptionist
            </h3>
            <p className="relative mt-2 text-[15px] leading-relaxed text-white/50">
              Instant missed-call replies, AI booking, reviews and CRM — so every
              enquiry gets handled.
            </p>

            <div className="relative mt-6 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80">
                30 days <span className="text-white/40">free</span>
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80">
                Then A$297 <span className="text-white/40">/month</span>
              </span>
            </div>

            <ul className="relative mt-8 flex flex-col gap-3.5">
              {receptionistFeatures.map((item, i) => (
                <ChecklistItem key={item} label={item} delay={i * 0.06} />
              ))}
            </ul>

            <div className="relative mt-8 flex flex-1 flex-col justify-end gap-3">
              {/* TODO: wire to real trial signup once onboarding/Stripe flow is redesigned */}
              <a
                href={TRIAL_CTA_HREF}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100"
              >
                Start My Free 30-Day Trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <p className="text-center text-xs text-white/40">{TRUST_LINE}</p>
            </div>
          </motion.div>

          {/* Package 2 — secondary upgrade */}
          <motion.div
            id="complete"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="flex h-full scroll-mt-24 flex-col rounded-3xl border border-zinc-200 bg-white p-6 sm:p-9"
          >
            <span className="inline-flex w-fit items-center rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              Optional Upgrade
            </span>

            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Velxo Complete
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-500">
              Everything in AI Receptionist, plus a high-converting website, SEO,
              lead capture and Business Preview.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700">
                30 days <span className="text-zinc-400">free</span>
              </span>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700">
                Then A$397 <span className="text-zinc-400">/month</span>
              </span>
            </div>

            <ul className="mt-8 flex flex-col gap-3.5">
              {completeFeatures.map((item, i) => (
                <ChecklistItem key={item} label={item} delay={i * 0.06} dark={false} />
              ))}
            </ul>

            <div className="mt-8 flex flex-1 flex-col justify-end gap-3">
              <Link
                href={PREVIEW_FORM_PATH}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-6 py-3.5 text-[15px] font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-50"
              >
                See My Business Preview
              </Link>
              <p className="text-center text-xs text-zinc-400">{COMPLETE_TRUST_LINE}</p>
            </div>
          </motion.div>
        </div>

        {/* Guarantee card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:flex-row sm:items-start sm:gap-5 sm:p-9 sm:text-left"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Rocket className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Launch in 7 days</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-500">
              Whichever package you start with, we&apos;ll configure
              everything and have your system live within 7 days.
            </p>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto mt-6 max-w-3xl overflow-hidden rounded-3xl bg-zinc-900 px-6 py-16 text-center sm:px-12 sm:py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          >
            <div className="h-56 w-[420px] rounded-full bg-blue-600/25 blur-3xl" />
          </div>

          <div className="relative">
            <h3 className="mx-auto max-w-lg text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl md:text-4xl">
              Ready to stop losing plumbing jobs?
            </h3>
            {/* TODO: wire to real trial signup once onboarding/Stripe flow is redesigned */}
            <a
              href={TRIAL_CTA_HREF}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100"
            >
              Start My Free 30-Day Trial
            </a>
            <p className="mx-auto mt-4 max-w-sm text-sm text-white/50">
              {TRUST_LINE}
            </p>
            <Link
              href={PREVIEW_FORM_PATH}
              className="mt-5 inline-block text-sm font-medium text-white/50 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
            >
              or see your Business Preview first
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ChecklistItem({
  label,
  delay,
  dark = true,
}: {
  label: string;
  delay: number;
  dark?: boolean;
}) {
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
        className={
          dark
            ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400"
            : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
        }
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </motion.span>
      <span className={dark ? "text-[14px] text-white/80" : "text-[14px] text-zinc-700"}>
        {label}
      </span>
    </motion.li>
  );
}
