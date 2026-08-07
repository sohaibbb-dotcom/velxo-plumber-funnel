"use client";

import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageSquareText, PhoneMissed } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TRIAL_CTA_HREF } from "@/lib/routes";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: EASE },
  }),
};

const heroHighlights = [
  "Missed-call replies",
  "AI booking",
  "Reviews & follow-ups",
  "CRM & pipeline",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-24 sm:pt-28 sm:pb-32">
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

        <motion.h1
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl md:text-6xl"
        >
          Stop Losing Jobs
          <br />
          While You&apos;re{" "}
          <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
            On The Tools
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg"
        >
          Velxo AI Receptionist handles instant missed-call replies, books jobs,
          requests reviews, and keeps your CRM, follow-ups and pipeline moving —
          so every enquiry gets a response and no lead slips away.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
        >
          {heroHighlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm"
            >
              {item}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={4}
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
          custom={5}
          variants={fadeUp}
          className="mt-4 text-xs font-medium text-zinc-400"
        >
          30 days free · Then A$297/month · No charge today · Cancel anytime
          before your trial ends
        </motion.p>

        <motion.a
          initial="hidden"
          animate="visible"
          custom={6}
          variants={fadeUp}
          href="#complete"
          className="mt-6 inline-block text-sm font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-800"
        >
          Need a new website too? Explore Velxo Complete →
        </motion.a>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        className="relative mx-auto mt-16 max-w-3xl px-4 sm:mt-20 sm:px-6 lg:px-8"
      >
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <FlowCard
              icon={<PhoneMissed className="h-4 w-4" />}
              iconClass="bg-red-50 text-red-500"
              title="Missed Call"
              subtitle="Unknown number · 2:14pm"
              delay={0.7}
            />
            <FlowConnector delay={0.8} />
            <FlowCard
              icon={<MessageSquareText className="h-4 w-4" />}
              iconClass="bg-blue-50 text-blue-600"
              title="Instant SMS Sent"
              subtitle="“Sorry we missed you — book here”"
              delay={0.85}
            />
            <FlowConnector delay={0.95} />
            <FlowCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              iconClass="bg-emerald-50 text-emerald-600"
              title="Job Booked"
              subtitle="Hot water repair · Tomorrow 9am"
              delay={1.0}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FlowConnector({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex shrink-0 items-center justify-center"
    >
      <ArrowRight className="hidden h-4 w-4 shrink-0 text-zinc-300 sm:block" />
      <div className="h-3 w-px bg-zinc-200 sm:hidden" />
    </motion.div>
  );
}

function FlowCard({
  icon,
  iconClass,
  title,
  subtitle,
  delay,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left"
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          iconClass,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        <p className="truncate text-xs text-zinc-500">{subtitle}</p>
      </div>
    </motion.div>
  );
}
