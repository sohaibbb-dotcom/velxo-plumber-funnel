"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BatteryFull,
  CheckCircle2,
  ChevronDown,
  MessageSquareText,
  Phone,
  PhoneMissed,
  PhoneOff,
  RotateCcw,
  Signal,
  Star,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const STEP_DELAY = 1100;
const TOTAL_STEPS = 4;

export function Demo() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };

  const play = () => {
    clearTimers();
    setStarted(true);
    setStep(0);
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      timeouts.current.push(setTimeout(() => setStep(i), i * STEP_DELAY));
    }
  };

  const reset = () => {
    clearTimers();
    setStarted(false);
    setStep(0);
  };

  useEffect(() => clearTimers, []);

  const threadSteps: { key: string; content: ReactNode }[] = [
    {
      key: "missed",
      content: (
        <Row>
          <PhoneMissed className="h-4 w-4 shrink-0 text-red-400" />
          <span className="text-sm text-white/70">Missed call from John</span>
        </Row>
      ),
    },
    {
      key: "sms",
      content: (
        <Bubble align="left" tag="Auto-reply sent">
          Hi John, sorry we missed your call. How can we help?
        </Bubble>
      ),
    },
    {
      key: "reply",
      content: <Bubble align="right">My hot water system stopped working.</Bubble>,
    },
    {
      key: "booking",
      content: (
        <StatusCard
          icon={<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
          label="Emergency Plumbing Appointment Confirmed"
        />
      ),
    },
    {
      key: "review",
      content: <ReviewBlock />,
    },
  ];

  return (
    <section id="demo" className="relative overflow-hidden bg-zinc-950 py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      >
        <div className="h-[420px] w-[720px] rounded-full bg-blue-600/20 blur-3xl" />
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
            Live Demo
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl md:text-5xl">
            See how Velxo works before you buy.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          className="mx-auto mt-14 max-w-sm"
        >
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 pt-4 text-[11px] font-medium text-white/70">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <BatteryFull className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="min-h-[420px] px-5 pt-6 pb-6">
              <AnimatePresence mode="wait">
                {!started ? (
                  <motion.div
                    key="incoming"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex h-[380px] flex-col items-center justify-between py-4"
                  >
                    <div className="flex flex-col items-center gap-1 pt-4">
                      <p className="text-xs font-medium tracking-wide text-white/50 uppercase">
                        Incoming call
                      </p>
                      <p className="mt-3 text-xl font-semibold text-white">John</p>
                      <p className="text-sm text-white/50">New Customer</p>
                    </div>

                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <motion.span
                        className="absolute h-24 w-24 rounded-full bg-blue-500/30"
                        animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      />
                      <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-semibold text-white">
                        J
                      </span>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Phone className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-medium text-white/60">Answer</span>
                      </div>

                      <button
                        type="button"
                        onClick={play}
                        className="group flex flex-col items-center gap-2"
                      >
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
                          <PhoneOff className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-medium text-white/60">Miss Call</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="thread"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex min-h-[380px] flex-col justify-center gap-2.5"
                  >
                    {threadSteps.slice(0, step + 1).map((item, i) => (
                      <div key={item.key}>
                        {i > 0 && (
                          <div className="flex justify-center py-1">
                            <ChevronDown className="h-3.5 w-3.5 text-white/20" />
                          </div>
                        )}
                        {item.content}
                      </div>
                    ))}

                    {step >= TOTAL_STEPS && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        onClick={reset}
                        className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors hover:text-white/70"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Replay demo
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex items-center justify-center gap-2"
    >
      {children}
    </motion.div>
  );
}

function Bubble({
  children,
  align,
  tag,
}: {
  children: ReactNode;
  align: "left" | "right";
  tag?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={cn("flex flex-col gap-1", align === "right" ? "items-end" : "items-start")}
    >
      {tag && (
        <span className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-white/40 uppercase">
          <MessageSquareText className="h-3 w-3" />
          {tag}
        </span>
      )}
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug",
          align === "right"
            ? "rounded-tr-sm bg-blue-500 text-white"
            : "rounded-tl-sm bg-white/10 text-white/90",
        )}
      >
        {children}
      </p>
    </motion.div>
  );
}

function StatusCard({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
      className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-3 text-[13px] font-medium text-emerald-300"
    >
      {icon}
      {label}
    </motion.div>
  );
}

function ReviewBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
    >
      <p className="text-[10px] font-medium tracking-wide text-white/40 uppercase">
        Review Requested
      </p>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              delay: i * 0.08,
              type: "spring",
              stiffness: 260,
              damping: 12,
            }}
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
