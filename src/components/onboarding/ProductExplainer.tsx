"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PhoneMissed,
  MessageSquareText,
  MessageCircle,
  ClipboardCheck,
  CalendarCheck,
  KanbanSquare,
  Star,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const STEP_DURATION_MS = 2200;

const SEQUENCE = [
  { icon: PhoneMissed, label: "Missed call", detail: "A customer calls and no one picks up." },
  { icon: MessageSquareText, label: "AI replies instantly by SMS", detail: '"Sorry we missed you — how can we help?"' },
  { icon: MessageCircle, label: "Customer responds", detail: "They text back with what they need." },
  { icon: ClipboardCheck, label: "AI qualifies the job", detail: "Gathers the details a real receptionist would." },
  { icon: CalendarCheck, label: "Booking created", detail: "A job is scheduled automatically." },
  { icon: KanbanSquare, label: "CRM pipeline updated", detail: "Your pipeline reflects the new job instantly." },
  { icon: Star, label: "Review request sent", detail: "Sent automatically once the job is done." },
] as const;

/**
 * Lightweight, looping product-explainer sequence — no video/audio, no
 * extra page. Purely CSS/Framer-Motion driven so it stays fast and works
 * identically on mobile.
 */
export function ProductExplainer() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % SEQUENCE.length);
    }, STEP_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-7">
      <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">How it works</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-balance text-white">
        Turn missed calls into booked jobs automatically.
      </h2>

      <div className="mt-6 flex flex-col gap-0.5">
        {SEQUENCE.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === active;
          const isDone = i < active;
          const isLast = i === SEQUENCE.length - 1;

          return (
            <div key={step.label} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <motion.span
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    backgroundColor: isActive || isDone ? "#8b5cf6" : "rgba(255,255,255,0.06)",
                    color: isActive || isDone ? "#ffffff" : "rgba(255,255,255,0.4)",
                  }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                </motion.span>
                {!isLast && (
                  <span
                    className={cn(
                      "h-6 w-px flex-1 transition-colors duration-500",
                      isDone ? "bg-violet-500" : "bg-white/10",
                    )}
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col pb-4">
                <span
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    isActive ? "text-white" : isDone ? "text-white/55" : "text-white/35",
                  )}
                >
                  {step.label}
                </span>
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span
                      key={step.label}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="mt-0.5 text-xs text-white/50"
                    >
                      {step.detail}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
