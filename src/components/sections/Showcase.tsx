"use client";

import { ComponentType, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Lock,
  MessageCircle,
  MessageSquareText,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  Smartphone,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREVIEW_FORM_PATH } from "@/lib/routes";

const EASE = [0.16, 1, 0.3, 1] as const;
const DEMO_URL = "https://melbourne-pro-plumbing.vercel.app/";
const DEMO_HOST = "melbourne-pro-plumbing.vercel.app";

type Callout = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  side: "left" | "right";
  top: string;
};

const callouts: Callout[] = [
  { id: "call", label: "Emergency Call Button", icon: PhoneCall, side: "right", top: "9%" },
  { id: "ai", label: "AI Receptionist", icon: Bot, side: "left", top: "30%" },
  { id: "booking", label: "Instant Booking", icon: CalendarCheck, side: "right", top: "51%" },
  { id: "reviews", label: "Google Reviews", icon: Star, side: "left", top: "72%" },
  { id: "mobile", label: "Mobile Optimised", icon: Smartphone, side: "right", top: "90%" },
];

export function Showcase() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      >
        <div className="h-[420px] w-[820px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
            Velxo Complete
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl md:text-5xl">
            See what Velxo Complete adds to the AI Receptionist experience.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/50 sm:text-lg">
            A premium website, SEO and lead-capture experience for plumbers who
            want everything in one place.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto mt-16 max-w-4xl md:mt-20"
        >
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1 text-[11px] text-white/40">
                <Lock className="h-2.5 w-2.5" />
                {DEMO_HOST}
              </div>
            </div>

            <div className="relative bg-white">
              <iframe
                src={DEMO_URL}
                title="Melbourne Pro Plumbing — live demo website"
                loading="lazy"
                className="block h-[480px] w-full border-0 sm:h-[560px] md:h-[640px]"
              />

              {callouts.map((c) => (
                <Spotlight key={c.id} callout={c} active={hovered === c.id} />
              ))}

              {callouts.map((c) => (
                <CalloutBadge
                  key={c.id}
                  callout={c}
                  active={hovered === c.id}
                  onHover={setHovered}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2 md:hidden">
          {callouts.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70"
            >
              <c.icon className="h-3 w-3 text-emerald-400" />
              {c.label}
            </span>
          ))}
        </div>

        <AutomationTimeline />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mt-20 max-w-xl text-center"
        >
          <h3 className="text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl md:text-4xl">
            Imagine your business working like this.
          </h3>
          <Link
            href={PREVIEW_FORM_PATH}
            className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100"
          >
            I Want My Business Like This
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function CalloutBadge({
  callout,
  active,
  onHover,
}: {
  callout: Callout;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const Icon = callout.icon;
  return (
    <motion.button
      type="button"
      onMouseEnter={() => onHover(callout.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(callout.id)}
      onBlur={() => onHover(null)}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
      style={{ top: callout.top }}
      className={cn(
        "absolute z-20 hidden -translate-y-1/2 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur-md transition-all duration-200 md:flex",
        callout.side === "right" ? "right-3" : "left-3",
        active
          ? "scale-105 border-emerald-400/60 bg-zinc-900/95 text-white"
          : "border-white/10 bg-zinc-900/80 text-white/80",
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <Icon className="h-3 w-3 shrink-0" />
      {callout.label}
    </motion.button>
  );
}

function Spotlight({ callout, active }: { callout: Callout; active: boolean }) {
  return (
    <motion.div
      aria-hidden
      animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.85 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{ top: callout.top }}
      className={cn(
        "pointer-events-none absolute z-10 hidden h-36 w-36 -translate-y-1/2 rounded-full bg-emerald-400/25 blur-2xl md:block",
        callout.side === "right" ? "right-6" : "left-6",
      )}
    />
  );
}

type Step = {
  title: string;
  icon: ComponentType<{ className?: string }>;
  quote?: string;
};

const steps: Step[] = [
  { title: "Customer calls", icon: PhoneIncoming },
  { title: "You miss the call", icon: PhoneMissed },
  {
    title: "Velxo automatically sends a reply",
    icon: MessageSquareText,
    quote: "Hi, sorry we missed your call. How can we help?",
  },
  { title: "Customer replies", icon: MessageCircle },
  { title: "Appointment booked automatically", icon: CalendarCheck },
  { title: "Job completed", icon: CheckCircle2 },
  { title: "Review request sent", icon: Star },
];

function AutomationTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="mx-auto mt-20 max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">
          Live Automation Timeline
        </p>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
          <LiveDot />
          Live
        </span>
      </div>

      <div className="relative mt-6 flex flex-col gap-5">
        <div aria-hidden className="absolute top-1 bottom-1 left-4 w-px bg-white/10" />

        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.4, ease: EASE }}
            className="relative flex flex-col gap-2"
          >
            <div className="flex items-center gap-3">
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-white/70">
                <step.icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[13px] font-medium text-white">{step.title}</span>
            </div>
            {step.quote && (
              <p className="ml-11 max-w-[85%] rounded-2xl rounded-tl-sm bg-blue-500/15 px-3.5 py-2.5 text-[13px] leading-snug text-blue-200">
                “{step.quote}”
              </p>
            )}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: steps.length * 0.15, duration: 0.4, ease: EASE }}
          className="relative flex items-center gap-3"
        >
          <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[11px] text-white/40">Google Review received</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}
