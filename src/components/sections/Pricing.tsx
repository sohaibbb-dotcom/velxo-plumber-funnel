"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Rocket } from "lucide-react";
import Link from "next/link";
import { PREVIEW_FORM_PATH, TRIAL_CTA_HREF } from "@/lib/routes";

const EASE = [0.16, 1, 0.3, 1] as const;

const COMPLETE_TRUST_LINE = "30 days free · Then A$397/month · No setup fee";

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
            Pricing &amp; Offer
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl md:text-5xl">
            One product. One clear offer.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-white/50 sm:text-lg">
            Try the AI Receptionist free for 30 days — no charge today.
          </p>
        </motion.div>

        {/* Primary offer — the only decision that matters here */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto mt-12 max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:mt-14 sm:p-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-600/25 to-blue-600/15 blur-3xl"
          />

          <span className="relative inline-flex w-fit items-center rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-violet-300 uppercase">
            The Offer
          </span>

          <h3 className="relative mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Velxo AI Receptionist
          </h3>
          <p className="relative mt-2 max-w-md text-[15px] leading-relaxed text-white/55">
            Instant missed-call replies, AI conversations, booking, follow-ups
            and reviews — so every enquiry gets handled.
          </p>

          {/* The offer, grouped in its own block so the financial story reads
              in one glance: the trial is the headline, $0 today removes the
              friction, and the ongoing price stays fully visible — never
              shrunk into microcopy. */}
          <div className="relative mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-[11px] font-semibold tracking-widest text-white/45 uppercase">
              Your Offer
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              30 Days{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                Free
              </span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                $0 today
              </span>
              <span className="text-[15px] font-medium text-white/65">
                then A$297/month after your trial
              </span>
            </div>
          </div>

          <p className="relative mt-8 text-[11px] font-semibold tracking-widest text-white/45 uppercase">
            What&apos;s Included
          </p>
          <ul className="relative mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {receptionistFeatures.map((item, i) => (
              <ChecklistItem key={item} label={item} delay={i * 0.06} />
            ))}
          </ul>

          <div className="relative mt-8 flex flex-col items-center gap-3">
            <a
              href={TRIAL_CTA_HREF}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/40 transition-all duration-200 hover:from-violet-500 hover:to-blue-500 sm:w-auto"
            >
              Start My 30-Day Free Trial
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <p className="text-center text-xs text-white/40">
              Cancel before your trial ends and pay nothing.
            </p>
          </div>
        </motion.div>

        {/* Go-live claim + optional Complete upgrade — both secondary to the
            offer above, not competing with it for attention. */}
        <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <Rocket className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">Go live fast</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-white/50">
                Most setups are ready within 1 business day.
              </p>
            </div>
          </motion.div>

          <motion.div
            id="complete"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.06, ease: EASE }}
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h3 className="text-sm font-semibold text-white">Need a website too?</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-white/50">
              Velxo Complete adds a full site — {COMPLETE_TRUST_LINE}.
            </p>
            <Link
              href={PREVIEW_FORM_PATH}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-violet-300 underline decoration-violet-400/30 underline-offset-4 transition-colors hover:text-violet-200"
            >
              See my free Business Preview
              <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
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
