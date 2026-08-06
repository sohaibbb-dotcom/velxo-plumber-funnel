"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Phone, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type StepVisual = "phone" | "sms" | "calendar" | "stars";

type Step = {
  number: string;
  title: string;
  description: string;
  visual: StepVisual;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Customer Calls",
    description: "A customer calls in — just like any other day.",
    visual: "phone",
  },
  {
    number: "02",
    title: "Instant Text-Back",
    description: "Can't answer? Velxo instantly texts them back.",
    visual: "sms",
  },
  {
    number: "03",
    title: "Job Gets Booked",
    description: "They reply, and the job books straight into your calendar.",
    visual: "calendar",
  },
  {
    number: "04",
    title: "Review Collected",
    description: "Job done? Velxo automatically asks for the Google review.",
    visual: "stars",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl md:text-5xl">
            From missed call to booked job automatically.
          </h2>
        </motion.div>

        <div className="relative mt-20">
          <div
            aria-hidden
            className="absolute top-5 right-0 left-0 hidden h-px bg-zinc-200 lg:block"
          />

          <div className="grid gap-10 lg:grid-cols-4 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                className="relative"
              >
                <div className="relative z-10 mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                  {step.number}
                </div>

                <div className="mb-5 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/60">
                  {step.visual === "phone" && <PhoneVisual />}
                  {step.visual === "sms" && <SmsVisual />}
                  {step.visual === "calendar" && <CalendarVisual />}
                  {step.visual === "stars" && <StarsVisual />}
                </div>

                <h3 className="text-base font-semibold text-zinc-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneVisual() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="relative flex items-center justify-center">
        <motion.span
          className="absolute h-16 w-16 rounded-full bg-blue-200/70"
          animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute h-16 w-16 rounded-full bg-blue-200/70"
          animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
        />
        <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <Phone className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

function SmsVisual() {
  return (
    <div className="flex h-40 flex-col justify-center gap-2 px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-zinc-200 px-3 py-2 text-[11px] text-zinc-500"
      >
        Missed call from customer
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="max-w-[85%] rounded-2xl rounded-tl-sm bg-blue-600 px-3 py-2 text-[11px] text-white"
      >
        Hey, sorry we missed your call. How can we help?
      </motion.div>
    </div>
  );
}

function CalendarVisual() {
  const days = [8, 9, 10, 11, 12, 13, 14];
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-1.5">
        {days.map((day, i) => (
          <div
            key={day}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-medium",
              i === 3
                ? "bg-blue-600 text-white"
                : "border border-zinc-200 bg-white text-zinc-400",
            )}
          >
            {day}
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
        className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Booked · Tomorrow 9am
      </motion.div>
    </div>
  );
}

function StarsVisual() {
  return (
    <div className="flex h-40 items-center justify-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 260, damping: 12 }}
        >
          <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
        </motion.span>
      ))}
    </div>
  );
}
