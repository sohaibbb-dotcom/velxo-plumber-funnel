"use client";

import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  BatteryFull,
  Bot,
  CalendarDays,
  Check,
  PhoneIncoming,
  PhoneMissed,
  Signal,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const CUSTOMER_NAME = "Sarah Mitchell";

/**
 * One story, three beats: missed call -> AI conversation -> booked job.
 * The booked calendar slot is the resting proof of outcome, not a fourth
 * beat — there's no CRM/pipeline stage here by design (that lives further
 * down the page). Kept as an ordered list (rather than a timestamp map) so
 * inserting/reordering frames can't desync the visibility math below.
 */
const PHASES = [
  { key: "ringing", duration: 900 },
  { key: "missed", duration: 800 },
  { key: "ai-typing-1", duration: 600 },
  { key: "ai-msg-1", duration: 1000 },
  { key: "customer-typing", duration: 600 },
  { key: "customer-msg-1", duration: 1500 },
  { key: "ai-typing-2", duration: 600 },
  { key: "ai-msg-2", duration: 1200 },
  { key: "customer-msg-2", duration: 900 },
  { key: "booked", duration: 1600 },
  { key: "calendar-fill", duration: 2000 },
  { key: "hold", duration: 2200 },
] as const;

type PhaseKey = (typeof PHASES)[number]["key"];
const LAST_PHASE = PHASES.length - 1;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Framer Motion's own useReducedMotion() reads matchMedia synchronously
// during render, so a reduced-motion device's first client render already
// disagrees with the (matchMedia-less) server render and trips a hydration
// mismatch. useSyncExternalStore's getServerSnapshot fixes the SSR value to
// `false` so the first client render matches SSR exactly, then resolves to
// the real value immediately after.
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
}

export function HeroProductDemo() {
  const reduceMotion = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  // Reduced-motion visitors land on the final, most informative frame
  // instead of freezing mid-story wherever the timer happened to be.
  const index = reduceMotion ? LAST_PHASE : step;

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => {
      setStep((i) => (i + 1) % PHASES.length);
    }, PHASES[step].duration);
    return () => clearTimeout(timer);
  }, [step, reduceMotion]);

  const phase: PhaseKey = PHASES[index].key;

  const isRinging = phase === "ringing";
  const showMissed = index >= 1;
  const threadStarted = index >= 2;
  const aiMsg1Visible = index >= 3;
  const customerMsg1Visible = index >= 5;
  const aiMsg2Visible = index >= 7;
  const customerMsg2Visible = index >= 8;
  const jobBooked = index >= 9;
  const calendarFilled = index >= 10;

  const dur = (value: number) => (reduceMotion ? 0 : value);

  const threadProps = {
    phase,
    isRinging,
    showMissed,
    threadStarted,
    aiMsg1Visible,
    customerMsg1Visible,
    aiMsg2Visible,
    customerMsg2Visible,
    jobBooked,
    dur,
  };

  return (
    <div className="mx-auto w-full max-w-sm lg:mx-0 lg:w-[700px] lg:max-w-none xl:w-[760px]">
      {/* Desktop / large tablet: phone overlapping the booking calendar.
          The composition sits in a fixed-width box (not the full grid
          column) so the phone/calendar overlap is a deliberate, small
          amount regardless of viewport — not whatever the grid happens to
          leave over. */}
      <div className="relative hidden h-[460px] lg:block xl:h-[500px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          <div className="h-[360px] w-[620px] rounded-full bg-gradient-to-br from-violet-600/25 via-blue-600/10 to-transparent blur-3xl" />
        </div>

        <div className="absolute top-0 left-0 z-20 w-[320px] -rotate-2 xl:w-[350px]">
          <PhoneFrame>
            <PhoneThreadContent {...threadProps} />
          </PhoneFrame>
        </div>

        <div className="absolute top-20 right-0 z-10 w-[430px] rotate-1 xl:w-[465px]">
          <DashboardPanel filled={calendarFilled} reduceMotion={!!reduceMotion} />
        </div>

        {jobBooked && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: dur(0.4), ease: EASE }
            }
            className="absolute bottom-0 left-[250px] z-30 w-[210px] xl:left-[275px]"
          >
            <BookingToast />
          </motion.div>
        )}
      </div>

      {/* Mobile / small tablet: a shorter, denser phone carries the whole
          story on its own — missed call, conversation, and the booked
          result all inside one card, so the outcome never depends on
          scrolling past it. */}
      <div className="lg:hidden">
        <PhoneFrame dense>
          <PhoneThreadContent {...threadProps} dense compact />
        </PhoneFrame>
      </div>
    </div>
  );
}

function PhoneThreadContent({
  phase,
  isRinging,
  showMissed,
  threadStarted,
  aiMsg1Visible,
  customerMsg1Visible,
  aiMsg2Visible,
  customerMsg2Visible,
  jobBooked,
  dur,
  dense = false,
  compact = false,
}: {
  phase: PhaseKey;
  isRinging: boolean;
  showMissed: boolean;
  threadStarted: boolean;
  aiMsg1Visible: boolean;
  customerMsg1Visible: boolean;
  aiMsg2Visible: boolean;
  customerMsg2Visible: boolean;
  jobBooked: boolean;
  dur: (value: number) => number;
  dense?: boolean;
  compact?: boolean;
}) {
  return (
    <>
      <CallStatusRow isRinging={isRinging} showMissed={showMissed} dense={dense} />
      {threadStarted && (
        <div className={cn("flex flex-col", dense ? "mt-1.5 gap-1" : "mt-2.5 gap-1.5")}>
          {phase === "ai-typing-1" && <TypingIndicator align="left" dur={dur} dense={dense} />}
          {aiMsg1Visible && (
            <ChatBubble align="left" dur={dur} dense={dense}>
              Hey, sorry we missed your call — is this an urgent plumbing
              issue?
            </ChatBubble>
          )}

          {phase === "customer-typing" && <TypingIndicator align="right" dur={dur} dense={dense} />}
          {customerMsg1Visible && (
            <ChatBubble align="right" dur={dur} dense={dense}>
              Hot water system just died.
            </ChatBubble>
          )}

          {/* Compact (mobile) view keeps the story to one clean exchange
              before the outcome — the full second exchange still plays in
              the underlying timing, it's just not re-shown as extra bubbles
              on a screen with no room to spare. */}
          {!compact && (
            <>
              {phase === "ai-typing-2" && <TypingIndicator align="left" dur={dur} dense={dense} />}
              {aiMsg2Visible && (
                <ChatBubble align="left" dur={dur} dense={dense}>
                  I can get someone out today at 2:30 PM.
                </ChatBubble>
              )}

              {customerMsg2Visible && (
                <ChatBubble align="right" dur={dur} dense={dense}>
                  Perfect 👍
                </ChatBubble>
              )}
            </>
          )}

          {jobBooked && <BookedChip dur={dur} emphasize={compact} />}
        </div>
      )}
    </>
  );
}

function PhoneFrame({ children, dense = false }: { children: ReactNode; dense?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div
        className={cn(
          "flex items-center justify-between font-medium text-white/50",
          dense ? "px-4 pt-3 text-[10px]" : "px-6 pt-4 text-[11px]",
        )}
      >
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal className="h-3 w-3" />
          <Wifi className="h-3 w-3" />
          <BatteryFull className="h-3.5 w-3.5" />
        </div>
      </div>

      <div
        className={cn(
          "flex items-center border-b border-white/5",
          dense ? "gap-2 px-4 pt-2 pb-2" : "gap-2.5 px-5 pt-3 pb-3",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white",
            dense ? "h-7 w-7" : "h-8 w-8",
          )}
        >
          <Bot className={dense ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold text-white", dense ? "text-[12px]" : "text-[13px]")}>
            Velxo AI
          </p>
          <p className={cn("truncate text-white/40", dense ? "text-[10px]" : "text-[11px]")}>
            AI Receptionist
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 font-medium text-emerald-400",
            dense ? "text-[10px]" : "text-[11px]",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Online
        </span>
      </div>

      <div className={dense ? "min-h-[180px] px-4 pt-2 pb-3.5" : "min-h-[270px] px-5 pt-3 pb-5"}>
        {children}
      </div>
    </div>
  );
}

function CallStatusRow({
  isRinging,
  showMissed,
  dense = false,
}: {
  isRinging: boolean;
  showMissed: boolean;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03]",
        dense ? "px-3 py-1.5" : "px-3.5 py-2.5",
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          dense ? "h-7 w-7" : "h-9 w-9",
        )}
      >
        {isRinging && (
          <motion.span
            aria-hidden
            className={cn(
              "absolute rounded-full bg-violet-400/30",
              dense ? "h-7 w-7" : "h-9 w-9",
            )}
            animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span
          className={cn(
            "relative z-10 flex items-center justify-center rounded-full text-white",
            dense ? "h-6 w-6" : "h-7 w-7",
            showMissed ? "bg-red-500/90" : "bg-violet-500/90",
          )}
        >
          {showMissed ? (
            <PhoneMissed className={dense ? "h-3 w-3" : "h-3.5 w-3.5"} />
          ) : (
            <PhoneIncoming className={dense ? "h-3 w-3" : "h-3.5 w-3.5"} />
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-semibold text-white", dense ? "text-[12px]" : "text-[14px]")}>
          {CUSTOMER_NAME}
        </p>
        <p
          className={cn(
            dense ? "text-[10px]" : "text-[12px]",
            showMissed ? "text-red-300/80" : "text-white/40",
          )}
        >
          {showMissed ? "Missed call · 10:24 AM" : "Incoming call..."}
        </p>
      </div>
    </div>
  );
}

function BookedChip({
  dur,
  emphasize = false,
}: {
  dur: (value: number) => number;
  emphasize?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: dur(0.4), type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "mx-auto flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/15 font-semibold text-emerald-300",
        emphasize ? "mt-2 px-3.5 py-2 text-[13px]" : "mt-1 px-3 py-1.5 text-[12px]",
      )}
    >
      <Check className={emphasize ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={3} />
      Job booked · 2:30 PM
    </motion.div>
  );
}

function ChatBubble({
  align,
  dur,
  dense = false,
  children,
}: {
  align: "left" | "right";
  dur: (value: number) => number;
  dense?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.35), ease: EASE }}
      className={cn(
        "w-fit max-w-[85%] rounded-2xl leading-snug",
        dense ? "px-3 py-1.5 text-[12px]" : "px-3.5 py-2 text-[13px]",
        align === "right"
          ? "ml-auto rounded-tr-sm bg-gradient-to-r from-violet-600 to-blue-600 text-white"
          : "rounded-tl-sm bg-white/10 text-white/85",
      )}
    >
      {children}
    </motion.div>
  );
}

function TypingIndicator({
  align,
  dur,
  dense = false,
}: {
  align: "left" | "right";
  dur: (value: number) => number;
  dense?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.25), ease: EASE }}
      className={cn(
        "flex w-fit items-center gap-1 rounded-2xl",
        dense ? "px-3 py-1.5" : "px-3.5 py-2.5",
        align === "right"
          ? "ml-auto rounded-tr-sm bg-gradient-to-r from-violet-600 to-blue-600"
          : "rounded-tl-sm bg-white/10",
      )}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            align === "right" ? "bg-white/70" : "bg-white/40",
          )}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

function DashboardPanel({
  filled,
  reduceMotion,
}: {
  filled: boolean;
  reduceMotion: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white/80">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-white">Today&apos;s Bookings</p>
            <p className="text-[11px] text-white/45">Tuesday, 21 May</p>
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/55">
          5 jobs
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <CalendarRow time="10:00 AM" title="Blocked Drain" />
        <CalendarRow time="11:30 AM" title="Gas Fitting" />
        <CalendarTargetRow filled={filled} reduceMotion={reduceMotion} />
        <CalendarRow time="4:00 PM" title="Tap Replacement" />
      </div>
    </div>
  );
}

function CalendarRow({ time, title }: { time: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[12px] font-medium text-white/40">{time}</span>
      <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <p className="truncate text-[12px] font-medium text-white/60">{title}</p>
      </div>
    </div>
  );
}

function CalendarTargetRow({
  filled,
  reduceMotion,
}: {
  filled: boolean;
  reduceMotion: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[12px] font-semibold text-white/85">2:30 PM</span>
      <div className="min-w-0 flex-1">
        {filled ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 22 }
            }
            className="rounded-lg border border-emerald-400/35 bg-emerald-500/12 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[13px] font-semibold text-white">{CUSTOMER_NAME}</p>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
                AI Booked
              </span>
            </div>
            <p className="truncate text-[11px] text-emerald-300/85">Emergency Plumbing</p>
          </motion.div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 px-3 py-2.5">
            <p className="text-[12px] font-medium text-white/30">Available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingToast() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-zinc-900/95 px-4 py-3.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-white">Booking Confirmed</p>
        <p className="truncate text-[11px] text-white/45">2:30 PM · {CUSTOMER_NAME}</p>
      </div>
    </div>
  );
}
