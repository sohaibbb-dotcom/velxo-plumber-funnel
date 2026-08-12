"use client";

import { ComponentType } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Plug,
  Rocket,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: EASE },
  }),
};

export function WhyVelxo() {
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
            Why Velxo
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl md:text-5xl">
            Why plumbing businesses choose Velxo.
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-5 lg:grid-cols-12">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 transition-shadow duration-300 hover:shadow-lg hover:shadow-zinc-200/60 lg:col-span-5"
          >
            <IconTile icon={MapPin} tint="bg-blue-50 text-blue-600" />
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-balance text-zinc-900">
              Designed specifically for Australian plumbing businesses.
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">
              Built around how Australian plumbers actually work — not a
              generic template.
            </p>
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 transition-shadow duration-300 hover:shadow-lg hover:shadow-zinc-200/60 lg:col-span-7"
          >
            <IconTile icon={Rocket} tint="bg-emerald-50 text-emerald-600" />
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">
              Go live fast.
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">
              Most Velxo setups are ready within 1 business day once we have
              everything we need.
            </p>
            <SetupFlow />
          </motion.div>

          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 transition-shadow duration-300 hover:shadow-lg hover:shadow-zinc-200/60 lg:col-span-7"
          >
            <IconTile icon={Settings2} tint="bg-violet-50 text-violet-600" />
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">
              Everything managed for you.
            </h3>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-500">
              We handle setup, automation, SMS, booking and every integration
              — you just keep doing plumbing.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {[
                { label: "Setup", icon: Settings2 },
                { label: "SMS", icon: MessageSquare },
                { label: "Booking", icon: CalendarCheck },
                { label: "Integrations", icon: Plug },
              ].map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600"
                >
                  <item.icon className="h-3.5 w-3.5 text-zinc-400" />
                  {item.label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 transition-shadow duration-300 hover:shadow-lg hover:shadow-zinc-200/60 lg:col-span-5"
          >
            <IconTile icon={LayoutDashboard} tint="bg-indigo-50 text-indigo-600" />
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-balance text-zinc-900">
              Built to grow with your business.
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {["One dashboard.", "One phone number.", "One place to manage customers."].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" />
                    <span className="text-[15px] font-medium text-zinc-700">{item}</span>
                  </li>
                ),
              )}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function IconTile({
  icon: Icon,
  tint,
}: {
  icon: ComponentType<{ className?: string }>;
  tint: string;
}) {
  return (
    <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tint)}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

const setupStages = ["Setup", "Test", "Live"];

function SetupFlow() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {setupStages.map((stage, i) => (
        <div key={stage} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium",
              i === setupStages.length - 1
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-zinc-50 text-zinc-600",
            )}
          >
            {stage}
          </span>
          {i < setupStages.length - 1 && (
            <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
          )}
        </div>
      ))}
    </div>
  );
}
