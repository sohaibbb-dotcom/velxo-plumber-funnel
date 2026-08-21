"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Check, PhoneIncoming, PhoneMissed, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Tone = "violet" | "red" | "emerald";

type Step = {
  id: "call" | "missed" | "responds" | "handles" | "booked" | "followup";
  label: string;
  caption: string;
  tone: Tone;
};

/**
 * The operational story behind the hero's result. Each stage renders a
 * small, real fragment of the same product surface established in the
 * hero (call state, SMS bubble, booking card, review nudge) rather than a
 * generic icon — so this reads as "the system caught mid-action," not an
 * infographic.
 */
const STEPS: Step[] = [
  { id: "call", label: "Customer Calls", caption: "A job comes in.", tone: "violet" },
  { id: "missed", label: "Call Is Missed", caption: "You're on the tools.", tone: "red" },
  { id: "responds", label: "Velxo Responds", caption: "Texts back in seconds.", tone: "violet" },
  { id: "handles", label: "AI Handles It", caption: "Understands the job.", tone: "violet" },
  { id: "booked", label: "Job Gets Booked", caption: "Confirmed automatically.", tone: "emerald" },
  { id: "followup", label: "Follow-Up & Review", caption: "Keeps the relationship going.", tone: "emerald" },
];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Same SSR-safe pattern used in HeroProductDemo.tsx (duplicated rather than
// shared, to avoid touching the approved hero file) — fixes the client's
// first render to `false` so it matches the (matchMedia-less) server render,
// then resolves to the real value immediately after.
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
}

export function HowItWorks() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section id="how-it-works" className="relative scroll-mt-20 bg-zinc-950 pb-24 sm:pb-28 lg:pb-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl md:text-5xl">
            From missed call to booked job.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-white/50 sm:text-lg">
            One system carries the whole job — automatically.
          </p>
        </motion.div>

        <div className="mt-8 sm:mt-10">
          <DesktopTimeline reduceMotion={reduceMotion} />
          <MobileTimeline reduceMotion={reduceMotion} />
        </div>
      </div>
    </section>
  );
}

function DesktopTimeline({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative hidden rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl lg:block">
      <div className="absolute top-[34px] right-7 left-7 h-px bg-white/10" aria-hidden>
        <motion.div
          initial={reduceMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: EASE }}
          style={{ transformOrigin: "left" }}
          className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-400"
        />
      </div>

      <div className="relative grid grid-cols-6 gap-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.5, delay: i * 0.12, ease: EASE }
            }
            className="flex flex-col items-center text-center"
          >
            <ToneDot tone={step.tone} />
            <div className="mt-3.5 flex min-h-[58px] items-center justify-center">
              <Fragment id={step.id} dense={false} />
            </div>
            <p className="mt-2.5 text-[13px] font-semibold text-white">{step.label}</p>
            <p className="mt-1 text-xs leading-snug text-white/55">{step.caption}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MobileTimeline({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:hidden">
      <div className="absolute inset-y-5 left-[29px] w-px bg-white/10" aria-hidden>
        <motion.div
          initial={reduceMotion ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: EASE }}
          style={{ transformOrigin: "top" }}
          className="h-full w-full bg-gradient-to-b from-violet-500 via-blue-500 to-emerald-400"
        />
      </div>

      <div className="relative flex flex-col gap-3.5">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.id}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.45, delay: i * 0.08, ease: EASE }
            }
            className="flex items-center gap-3"
          >
            <div className="relative flex w-[18px] shrink-0 justify-center self-stretch">
              <span className="flex items-center">
                <ToneDot tone={step.tone} />
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white">{step.label}</p>
                <p className="text-[11px] leading-snug text-white/55">{step.caption}</p>
              </div>
              <div className="shrink-0">
                <Fragment id={step.id} dense />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const TONE_DOT_CLASSES: Record<Tone, string> = {
  violet: "bg-violet-400",
  red: "bg-red-400",
  emerald: "bg-emerald-400",
};

function ToneDot({ tone }: { tone: Tone }) {
  return (
    <span
      className={cn(
        "relative z-10 block h-3 w-3 shrink-0 rounded-full ring-4 ring-zinc-950",
        TONE_DOT_CLASSES[tone],
      )}
    />
  );
}

/** Renders the small, real product-UI fragment for a given stage. */
function Fragment({ id, dense }: { id: Step["id"]; dense: boolean }) {
  switch (id) {
    case "call":
      return <CallChip missed={false} dense={dense} />;
    case "missed":
      return <CallChip missed dense={dense} />;
    case "responds":
      return (
        <Bubble dense={dense} align="left">
          Sorry we missed your call…
        </Bubble>
      );
    case "handles":
      return (
        <div className="flex flex-col gap-1">
          <Bubble dense={dense} align="right">
            Hot water died.
          </Bubble>
          <Bubble dense={dense} align="left">
            Got it — I can help.
          </Bubble>
        </div>
      );
    case "booked":
      return <BookedCard dense={dense} />;
    case "followup":
      return <ReviewChip dense={dense} />;
  }
}

function CallChip({ missed, dense }: { missed: boolean; dense: boolean }) {
  const Icon = missed ? PhoneMissed : PhoneIncoming;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05]",
        dense ? "px-2.5 py-2" : "px-3 py-2.5",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-white",
          dense ? "h-5 w-5" : "h-6 w-6",
          missed ? "bg-red-500/90" : "bg-violet-500/90",
        )}
      >
        <Icon className={dense ? "h-2.5 w-2.5" : "h-3 w-3"} />
      </span>
      <div className="min-w-0 text-left">
        <p className={cn("truncate font-semibold text-white", dense ? "text-[11px]" : "text-[12px]")}>
          Sarah M.
        </p>
        <p
          className={cn(
            "truncate",
            dense ? "text-[9px]" : "text-[10px]",
            missed ? "text-red-300/80" : "text-white/55",
          )}
        >
          {missed ? "Missed call" : "Incoming…"}
        </p>
      </div>
    </div>
  );
}

function Bubble({
  align,
  dense,
  children,
}: {
  align: "left" | "right";
  dense: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-fit rounded-2xl leading-snug",
        dense ? "max-w-[126px] px-2.5 py-1.5 text-[10px]" : "max-w-[150px] px-3 py-2 text-[11px]",
        align === "right"
          ? "ml-auto rounded-tr-sm bg-gradient-to-r from-violet-600 to-blue-600 text-white"
          : "rounded-tl-sm bg-white/10 text-white/85",
      )}
    >
      {children}
    </div>
  );
}

function BookedCard({ dense }: { dense: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-400/30 bg-emerald-500/12 text-left shadow-[0_0_20px_-6px_rgba(16,185,129,0.45)]",
        dense ? "w-[136px] px-2.5 py-2" : "w-[150px] px-3 py-2.5",
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <p className={cn("font-semibold text-white", dense ? "text-[11px]" : "text-[13px]")}>2:30 PM</p>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/20 font-medium text-emerald-300",
            dense ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[9px]",
          )}
        >
          <Check className={dense ? "h-2 w-2" : "h-2.5 w-2.5"} strokeWidth={3} />
          Confirmed
        </span>
      </div>
      <p className={cn("mt-0.5 truncate text-emerald-300/80", dense ? "text-[9px]" : "text-[10px]")}>
        Sarah Mitchell · Plumbing
      </p>
    </div>
  );
}

function ReviewChip({ dense }: { dense: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.05] text-left",
        dense ? "w-[136px] px-2.5 py-2" : "w-[150px] px-3 py-2.5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300",
          dense ? "h-5 w-5" : "h-6 w-6",
        )}
      >
        <Star className={cn(dense ? "h-2.5 w-2.5" : "h-3 w-3", "fill-current")} />
      </span>
      <div className="min-w-0">
        <p className={cn("leading-snug text-white/75", dense ? "text-[9px]" : "text-[10px]")}>
          Mind leaving a review?
        </p>
        <div className="mt-1 flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={cn(dense ? "h-2 w-2" : "h-2.5 w-2.5", "fill-amber-400 text-amber-400")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
