"use client";

import { ComponentType } from "react";
import { motion } from "framer-motion";
import { Clock, MessageSquareOff, PhoneMissed, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Problem = {
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  description: string;
};

const problems: Problem[] = [
  {
    icon: PhoneMissed,
    iconClass: "bg-red-50 text-red-500",
    title: "Missed Calls",
    description: "You're on the tools. They call the next plumber instead.",
  },
  {
    icon: MessageSquareOff,
    iconClass: "bg-orange-50 text-orange-500",
    title: "No Follow Up",
    description: "The enquiry goes quiet. No one ever follows up.",
  },
  {
    icon: Star,
    iconClass: "bg-amber-50 text-amber-500",
    title: "Few Google Reviews",
    description: "The job's done — but nobody asks for the review.",
  },
  {
    icon: Clock,
    iconClass: "bg-rose-50 text-rose-500",
    title: "Slow Response Times",
    description: "By the time you call back, they've already booked someone else.",
  },
];

export function Problem() {
  return (
    <section className="bg-zinc-50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            The Problem
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl md:text-5xl">
            Every missed call is a job your competitor can take.
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-zinc-200/50"
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                  problem.iconClass,
                )}
              >
                <problem.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-zinc-900">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
