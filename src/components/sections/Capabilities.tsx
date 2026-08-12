"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, PhoneMissed, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Capabilities() {
  return (
    <section className="bg-white pt-4 pb-20 sm:pt-8 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl md:text-4xl">
            While you&apos;re on the tools,
            <br className="hidden sm:block" /> Velxo keeps your phone working.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-zinc-500">
            Every missed call is a potential job. Velxo makes sure customers get a
            response, get booked, and don&apos;t slip through the cracks.
          </p>
        </motion.div>

        {/* Asymmetric bento: two rich feature cards up top, two compact
            supporting cards below — deliberately not four equal boxes. */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 lg:grid-cols-2">
          <FeatureCard
            size="large"
            title="Instant Replies"
            caption="AI responds to missed calls in seconds — even while you're on a job."
            delay={0}
          >
            <RepliesVisual />
          </FeatureCard>

          <FeatureCard
            size="large"
            title="Books Jobs"
            caption="Velxo checks availability and books the job automatically."
            delay={0.1}
          >
            <BookingVisual />
          </FeatureCard>

          <FeatureCard
            size="small"
            title="Follows Up"
            caption="Automatic follow-ups so leads don't go cold."
            delay={0.2}
          >
            <FollowUpVisual />
          </FeatureCard>

          <FeatureCard
            size="small"
            title="More Reviews"
            caption="Velxo asks for the Google review once the job's done."
            delay={0.3}
          >
            <ReviewsVisual />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  size,
  title,
  caption,
  delay,
  children,
}: {
  size: "large" | "small";
  title: string;
  caption: string;
  delay: number;
  children: ReactNode;
}) {
  const large = size === "large";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_30px_-24px_rgba(0,0,0,0.2)]",
        large ? "p-6 sm:p-8" : "p-6",
      )}
    >
      <div
        className={cn(
          "flex flex-1 items-center justify-center",
          large ? "min-h-[170px] sm:min-h-[190px]" : "min-h-[150px]",
        )}
      >
        {children}
      </div>
      <div className={large ? "mt-2" : "mt-1"}>
        <h3 className={cn("font-semibold text-zinc-900", large ? "text-lg sm:text-xl" : "text-base")}>
          {title}
        </h3>
        <p className={cn("mt-1.5 text-zinc-500", large ? "text-sm sm:text-[15px]" : "text-sm")}>
          {caption}
        </p>
      </div>
    </motion.div>
  );
}

function RepliesVisual() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500"
      >
        <PhoneMissed className="h-3 w-3" />
        Missed call from Sarah
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="max-w-[85%] rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 text-[13px] leading-snug text-zinc-700"
      >
        Hi Sarah, sorry we missed your call — how can we help?
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-3.5 py-2.5 text-[13px] leading-snug text-white"
      >
        Hot water system stopped working. Can someone come today?
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.62 }}
        className="max-w-[85%] rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 text-[13px] leading-snug text-zinc-700"
      >
        Yep — we have 2:30 PM available.
      </motion.div>
    </div>
  );
}

function BookingVisual() {
  const hours = ["9", "10", "11", "12", "1", "2", "3"];
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <div className="flex items-center gap-1.5">
        {hours.map((h, i) => (
          <span
            key={h}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-medium",
              i === 5 ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-400",
            )}
          >
            {h}
          </span>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.92 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4"
      >
        <p className="text-xs font-medium text-blue-600">2:30 PM</p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">Sarah Mitchell</p>
        <p className="text-xs text-zinc-500">Emergency Plumbing</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        Confirmed automatically
      </motion.div>
    </div>
  );
}

function FollowUpVisual() {
  const steps = [
    { day: "Day 1", detail: "Follow-up sent" },
    { day: "Day 3", detail: "Check-in" },
    { day: "Day 7", detail: "Final follow-up" },
  ];
  return (
    <div className="relative flex w-full max-w-[220px] flex-col gap-4 pl-1">
      <div aria-hidden className="absolute top-1.5 bottom-1.5 left-[7px] w-px bg-zinc-200" />
      {steps.map((step, i) => (
        <motion.div
          key={step.day}
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.15 }}
          className="relative flex items-center gap-3"
        >
          <span
            className={cn(
              "relative z-10 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white",
              i === 0 ? "bg-blue-600" : "bg-zinc-300",
            )}
          />
          <div>
            <p className="text-xs font-medium text-zinc-700">{step.day}</p>
            <p className="text-[11px] text-zinc-400">{step.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ReviewsVisual() {
  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      <span className="text-[11px] font-medium text-zinc-400">Job completed</span>
      <ChevronDown className="h-3 w-3 text-zinc-300" />
      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
        Review request sent
      </span>
      <ChevronDown className="h-3 w-3 text-zinc-300" />
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 14 }}
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </motion.span>
        ))}
      </div>
    </div>
  );
}
