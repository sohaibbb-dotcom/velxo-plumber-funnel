"use client";

import { ComponentType } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  CalendarCheck,
  Globe,
  PhoneIncoming,
  RefreshCw,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Feature = {
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: PhoneIncoming,
    iconClass: "bg-blue-50 text-blue-600",
    title: "Never Miss A Lead",
    description:
      "Velxo texts missed callers back instantly — before they call your competitor.",
  },
  {
    icon: Bot,
    iconClass: "bg-violet-50 text-violet-600",
    title: "24/7 Customer Response",
    description: "Your AI assistant answers customers day or night.",
  },
  {
    icon: CalendarCheck,
    iconClass: "bg-emerald-50 text-emerald-600",
    title: "More Bookings",
    description: "Customers book straight into your calendar — no back-and-forth.",
  },
  {
    icon: Star,
    iconClass: "bg-amber-50 text-amber-600",
    title: "More Google Reviews",
    description: "Velxo asks for a Google review after every job.",
  },
  {
    icon: RefreshCw,
    iconClass: "bg-sky-50 text-sky-600",
    title: "Follow Up Automatically",
    description: "No enquiry gets forgotten, even on your busiest days.",
  },
  {
    icon: Globe,
    iconClass: "bg-indigo-50 text-indigo-600",
    title: "AI Website (Velxo Complete)",
    description: "Add a site built to convert visitors into paying customers.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            What You Get
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl md:text-5xl">
            Everything needed to stop losing plumbing jobs.
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: EASE }}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/60"
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                  feature.iconClass,
                )}
              >
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-zinc-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
