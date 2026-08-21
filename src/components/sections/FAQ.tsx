"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Every answer here is verified against actual implementation, not
 * invented: AiSetupStep.tsx (forward-existing-number vs new-number choice),
 * TrialReassurance.tsx / WhatHappensNext.tsx (trial + charge mechanics),
 * subscriptionCheckout.ts (30-day trial_period_days, card added not charged),
 * plans.ts (post-trial price), and ProductExplainer.tsx's confirmed
 * missed-call -> AI reply -> qualify -> book -> review sequence.
 */
const FAQS = [
  {
    q: "What happens after I miss a call?",
    a: "Velxo's AI texts your customer back within seconds, has a real conversation to understand what they need, and can book the job straight onto your calendar — automatically.",
  },
  {
    q: "Does Velxo replace my existing phone number?",
    a: "No. During setup you choose whether to forward your existing business number or use a new Velxo number — either way, missed calls still get an instant response.",
  },
  {
    q: "Can I cancel during the trial?",
    a: "Yes — cancel any time before your trial ends and you won't be charged anything.",
  },
  {
    q: "When will I be charged?",
    a: "Not until your 30-day trial ends. Your card is added at signup but isn't charged during the trial.",
  },
  {
    q: "What happens after the 30 days?",
    a: "If you haven't cancelled, your subscription continues at A$297/month for the AI Receptionist plan.",
  },
  {
    q: "Can Velxo book jobs automatically?",
    a: "Yes — once the AI has what it needs from the conversation, it books the job directly into your calendar and pipeline.",
  },
  {
    q: "What if the customer replies?",
    a: "The AI keeps the SMS conversation going, asking the right questions to understand the job before booking it.",
  },
  {
    q: "How long does setup take?",
    a: "Most Velxo setups are ready within 1 business day once we have everything we need from you.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-20 bg-zinc-950 py-14 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">
            Questions
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl md:text-5xl">
            Before you start.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl sm:mt-12"
        >
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q} className={cn(i !== 0 && "border-t border-white/[0.08]")}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <span className="text-[14px] font-medium text-white sm:text-[15px]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-white/40 transition-transform duration-300",
                      isOpen && "rotate-180 text-violet-300",
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-[13px] leading-relaxed text-white/50 sm:px-6 sm:text-[14px]">
                    {item.a}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
