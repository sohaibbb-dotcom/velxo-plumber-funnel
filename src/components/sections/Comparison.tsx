"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const without = [
  "Missed calls",
  "Lost customers",
  "Manual follow ups",
  "Few reviews",
  "No central CRM",
];

const withVelxo = [
  "Instant responses",
  "More booked jobs",
  "Automatic follow ups",
  "More reviews",
  "Every lead tracked in one place",
];

export function Comparison() {
  return (
    <section className="relative overflow-hidden bg-zinc-50 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Before &amp; After
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl md:text-5xl">
            Your business before and after Velxo.
          </h2>
        </motion.div>

        <div className="relative mt-16 grid gap-3 md:grid-cols-2 md:gap-8">
          <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-400 shadow-sm"
            >
              VS
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10"
          >
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Without Velxo
            </p>
            <ul className="mt-6 flex flex-col gap-4">
              {without.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: EASE }}
                  className="flex items-center gap-3"
                >
                  <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <span className="text-[15px] text-zinc-500">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <div className="flex justify-center md:hidden">
            <ChevronDown className="h-5 w-5 text-zinc-300" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl shadow-zinc-900/20 sm:p-10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-600/30 blur-3xl"
            />

            <p className="relative text-xs font-semibold tracking-widest text-blue-400 uppercase">
              With Velxo
            </p>
            <ul className="relative mt-6 flex flex-col gap-4">
              {withVelxo.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: EASE }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <span className="text-[15px] font-medium text-white">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
