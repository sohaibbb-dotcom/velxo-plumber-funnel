"use client";

import { ComponentType } from "react";
import { motion } from "framer-motion";
import { Bot, CalendarCheck, MessageSquareText, RefreshCcw, Star } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const capabilities: { label: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: "AI Receptionist", icon: Bot },
  { label: "Smart Booking", icon: CalendarCheck },
  { label: "AI Conversations", icon: MessageSquareText },
  { label: "Follow-ups", icon: RefreshCcw },
  { label: "Reviews", icon: Star },
];

/**
 * Sits directly under the hero on the same near-black background (no
 * section-level gap/border) so it reads as a continuation of the hero
 * rather than a new block — "here's the system behind what you just saw."
 */
export function CapabilityStrip() {
  return (
    <section className="relative bg-zinc-950 pb-10 sm:pb-14 lg:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Mobile: a single horizontally-scrollable strip — a breadth
            signal you swipe through in one gesture, never a row that
            leaves an orphaned last item or grows the section tall. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="lg:hidden"
        >
          <p className="mb-2.5 text-center text-[11px] font-medium tracking-wide text-white/40">
            Everything included, in one system
          </p>
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden"
            style={{
              scrollbarWidth: "none",
              maskImage: "linear-gradient(to right, black 92%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, black 92%, transparent)",
            }}
          >
            {capabilities.map((cap) => (
              <div
                key={cap.label}
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-2 pr-4 pl-2.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-violet-300 ring-1 ring-inset ring-white/10">
                  <cap.icon className="h-3.5 w-3.5" />
                </span>
                <span className="whitespace-nowrap text-[13px] font-medium text-white/90">
                  {cap.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Desktop: unchanged single connected strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl lg:block"
        >
          <div className="flex divide-x divide-white/[0.08]">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
                className="flex flex-1 items-center gap-3 px-5 py-4 sm:px-6 sm:py-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-violet-300 ring-1 ring-inset ring-white/10">
                  <cap.icon className="h-5 w-5" />
                </span>
                <span className="text-[15px] font-medium text-white/90">{cap.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
