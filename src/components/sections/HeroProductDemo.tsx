"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Check,
  Kanban,
  MessageSquareText,
  PhoneIncoming,
  PhoneMissed,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const CUSTOMER_NAME = "Sarah Mitchell";

/**
 * One full narrative loop: missed call -> AI conversation -> job booked ->
 * calendar slot fills -> CRM pipeline catches up. Index drives every stage
 * card below; `duration` is how long that frame holds before advancing.
 * Kept as an ordered list (rather than a timestamp map) so
 * inserting/reordering frames can't desync the visibility math.
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
  { key: "crm-move", duration: 2000 },
  { key: "hold", duration: 2200 },
] as const;

type PhaseKey = (typeof PHASES)[number]["key"];
const LAST_PHASE = PHASES.length - 1;

type Stage = 0 | 1 | 2;
const PIPELINE_STAGES = ["New Lead", "AI Contacted", "Booked"] as const;

type ConnectorState = "pending" | "active" | "done";

export function HeroProductDemo() {
  const reduceMotion = useReducedMotion();
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
  const holding = phase === "hold";

  // Stage 0 — Missed Call
  const isRinging = phase === "ringing";
  const showMissed = index >= 1;

  // Stage 1 — AI Replies
  const threadStarted = index >= 2;
  const aiMsg1Visible = index >= 3;
  const customerMsg1Visible = index >= 5;
  const aiMsg2Visible = index >= 7;
  const customerMsg2Visible = index >= 8;

  // Stage 2 — Job Booked
  const jobBooked = index >= 9;

  // Stage 3 — Calendar
  const calendarFilled = index >= 10;

  // Stage 4 — Pipeline
  const crmStage: Stage = index <= 1 ? 0 : index <= 10 ? 1 : 2;

  // Which of the 5 stages currently has the visitor's attention — drives
  // both the card emphasis/dimming and the connector states between them.
  const activeStage = index <= 1 ? 0 : index <= 8 ? 1 : index === 9 ? 2 : index === 10 ? 3 : 4;

  const mobileScene =
    index <= 1
      ? "missed"
      : index <= 8
        ? "conversation"
        : index === 9
          ? "booked"
          : index === 10
            ? "calendar"
            : "pipeline";

  const dur = (value: number) => (reduceMotion ? 0 : value);
  const cardActive = (stage: number) => holding || activeStage === stage;
  const connectorState = (afterStage: number): ConnectorState => {
    if (holding) return "done";
    if (activeStage > afterStage + 1) return "done";
    if (activeStage === afterStage + 1) return "active";
    return "pending";
  };

  // Sound is entirely synthesised via Web Audio — no audio assets, no
  // autoplay. The context is only ever created inside the toggle's click
  // handler so it's backed by a real user gesture.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastCuedStepRef = useRef(-1);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!soundEnabled || reduceMotion) return;
    if (lastCuedStepRef.current === step) return;
    lastCuedStepRef.current = step;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    playCue(ctx, PHASES[step].key);
  }, [step, soundEnabled, reduceMotion]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
          }
          if (audioCtxRef.current.state === "suspended") {
            void audioCtxRef.current.resume();
          }
        } catch {
          return prev;
        }
      }
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? "Mute demo sound" : "Unmute demo sound"}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm transition-colors hover:text-zinc-700"
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Desktop / tablet: one connected horizontal journey */}
      <div className="hidden md:flex md:items-stretch md:gap-2 lg:gap-3">
        <Panel step={1} label="Missed Call" active={cardActive(0)} dur={dur} grow={1}>
          <MissedCallCard isRinging={isRinging} showMissed={showMissed} />
        </Panel>

        <Connector state={connectorState(0)} />

        <Panel step={2} label="AI Replies" active={cardActive(1)} dur={dur} grow={1.7}>
          <ConversationCard
            started={threadStarted}
            phase={phase}
            aiMsg1Visible={aiMsg1Visible}
            customerMsg1Visible={customerMsg1Visible}
            aiMsg2Visible={aiMsg2Visible}
            customerMsg2Visible={customerMsg2Visible}
            dur={dur}
          />
        </Panel>

        <Connector state={connectorState(1)} />

        <Panel step={3} label="Job Booked" active={cardActive(2)} dur={dur} grow={1}>
          <JobBookedCard visible={jobBooked} reduceMotion={!!reduceMotion} dur={dur} />
        </Panel>

        <Connector state={connectorState(2)} />

        <Panel step={4} label="Calendar" active={cardActive(3)} dur={dur} grow={1.2}>
          <CalendarCard filled={calendarFilled} reduceMotion={!!reduceMotion} />
        </Panel>

        <Connector state={connectorState(3)} />

        <Panel step={5} label="Pipeline" active={cardActive(4)} dur={dur} grow={1}>
          <PipelinePanel stage={crmStage} reduceMotion={!!reduceMotion} layoutId="pipeline-lead-desktop" />
        </Panel>
      </div>

      {/* Mobile: same 5-stage story, one scene at a time, no horizontal squeeze */}
      <div className="md:hidden">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.2)]">
          <AnimatePresence mode="wait">
            {mobileScene === "missed" && (
              <MobileScene key="missed" dur={dur} icon={<PhoneIncoming className="h-3.5 w-3.5" />} label="1 · Missed Call">
                <MissedCallCard isRinging={isRinging} showMissed={showMissed} />
              </MobileScene>
            )}
            {mobileScene === "conversation" && (
              <MobileScene key="conversation" dur={dur} icon={<MessageSquareText className="h-3.5 w-3.5" />} label="2 · AI Replies">
                <ConversationCard
                  started={threadStarted}
                  phase={phase}
                  aiMsg1Visible={aiMsg1Visible}
                  customerMsg1Visible={customerMsg1Visible}
                  aiMsg2Visible={aiMsg2Visible}
                  customerMsg2Visible={customerMsg2Visible}
                  dur={dur}
                />
              </MobileScene>
            )}
            {mobileScene === "booked" && (
              <MobileScene key="booked" dur={dur} icon={<Check className="h-3.5 w-3.5" />} label="3 · Job Booked">
                <JobBookedCard visible={jobBooked} reduceMotion={!!reduceMotion} dur={dur} />
              </MobileScene>
            )}
            {mobileScene === "calendar" && (
              <MobileScene key="calendar" dur={dur} icon={<Calendar className="h-3.5 w-3.5" />} label="4 · Calendar">
                <CalendarCard filled={calendarFilled} reduceMotion={!!reduceMotion} />
              </MobileScene>
            )}
            {mobileScene === "pipeline" && (
              <MobileScene key="pipeline" dur={dur} icon={<Kanban className="h-3.5 w-3.5" />} label="5 · Pipeline">
                <PipelinePanel stage={crmStage} reduceMotion={!!reduceMotion} layoutId="pipeline-lead-mobile" />
              </MobileScene>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
          {(["missed", "conversation", "booked", "calendar", "pipeline"] as const).map((scene) => (
            <span
              key={scene}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                mobileScene === scene ? "w-5 bg-blue-600" : "w-1.5 bg-zinc-200",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileScene({
  dur,
  icon,
  label,
  children,
}: {
  dur: (value: number) => number;
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: dur(0.35), ease: EASE }}
    >
      <PanelLabel icon={icon} label={label} />
      {children}
    </motion.div>
  );
}

function PanelLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5 text-zinc-400">
      {icon}
      <span className="text-[10px] font-semibold tracking-wide uppercase">{label}</span>
    </div>
  );
}

function Panel({
  step,
  label,
  active,
  dur,
  grow,
  children,
}: {
  step: number;
  label: string;
  active: boolean;
  dur: (value: number) => number;
  grow: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0.55, scale: active ? 1 : 0.98 }}
      transition={{ duration: dur(0.4), ease: EASE }}
      style={{ flexGrow: grow, flexBasis: 0 }}
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-4 transition-shadow duration-300",
        active
          ? "border-zinc-200 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.25)]"
          : "border-zinc-100 shadow-none",
      )}
    >
      <PanelLabel icon={<span className="text-[10px] font-semibold text-zinc-300">{step}</span>} label={label} />
      {children}
    </motion.div>
  );
}

function Connector({ state }: { state: ConnectorState }) {
  return (
    <div className="relative h-px w-6 shrink-0 self-center overflow-visible bg-zinc-200 lg:w-8">
      <motion.div
        aria-hidden
        initial={false}
        animate={{ scaleX: state === "pending" ? 0 : 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="absolute inset-0 origin-left bg-blue-400"
      />
      {state === "active" && (
        <motion.span
          aria-hidden
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500"
          animate={{ left: ["0%", "94%"], opacity: [0, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

function MissedCallCard({ isRinging, showMissed }: { isRinging: boolean; showMissed: boolean }) {
  return (
    <div className="flex min-h-[160px] flex-1 flex-col items-center justify-center gap-3 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center">
        {isRinging && (
          <motion.span
            aria-hidden
            className="absolute h-14 w-14 rounded-full bg-blue-100"
            animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span
          className={cn(
            "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-white",
            showMissed ? "bg-red-500" : "bg-blue-600",
          )}
        >
          {showMissed ? <PhoneMissed className="h-4 w-4" /> : <PhoneIncoming className="h-4 w-4" />}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900">{CUSTOMER_NAME}</p>
        <p className={cn("text-xs", showMissed ? "font-medium text-red-500" : "text-zinc-400")}>
          {showMissed ? "Missed Call" : "Emergency plumbing"}
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-300">10:24 AM</p>
      </div>
    </div>
  );
}

function ConversationCard({
  started,
  phase,
  aiMsg1Visible,
  customerMsg1Visible,
  aiMsg2Visible,
  customerMsg2Visible,
  dur,
}: {
  started: boolean;
  phase: PhaseKey;
  aiMsg1Visible: boolean;
  customerMsg1Visible: boolean;
  aiMsg2Visible: boolean;
  customerMsg2Visible: boolean;
  dur: (value: number) => number;
}) {
  return (
    <div className="flex min-h-[230px] flex-1 flex-col justify-center">
      {!started ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center opacity-40">
          <MessageSquareText className="h-5 w-5 text-zinc-300" />
          <p className="text-xs text-zinc-300">Waiting to respond...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {phase === "ai-typing-1" && <TypingIndicator align="left" dur={dur} />}
          {aiMsg1Visible && (
            <ChatBubble align="left" dur={dur}>
              Hi Sarah, sorry we missed your call. How can we help?
            </ChatBubble>
          )}

          {phase === "customer-typing" && <TypingIndicator align="right" dur={dur} />}
          {customerMsg1Visible && (
            <ChatBubble align="right" dur={dur}>
              Hot water system stopped working. Can someone come today?
            </ChatBubble>
          )}

          {phase === "ai-typing-2" && <TypingIndicator align="left" dur={dur} />}
          {aiMsg2Visible && (
            <ChatBubble align="left" dur={dur}>
              Yep! We have 2:30 PM available today. Shall I book that for you?
            </ChatBubble>
          )}

          {customerMsg2Visible && (
            <ChatBubble align="right" dur={dur}>
              Perfect 👍
            </ChatBubble>
          )}
        </div>
      )}
    </div>
  );
}

function JobBookedCard({
  visible,
  reduceMotion,
  dur,
}: {
  visible: boolean;
  reduceMotion: boolean;
  dur: (value: number) => number;
}) {
  return (
    <div className="flex min-h-[160px] flex-1 flex-col items-center justify-center gap-2.5 text-center">
      {visible ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: dur(0.4), type: "spring", stiffness: 260, damping: 20 }
          }
          className="flex flex-col items-center gap-2.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <p className="text-sm font-semibold text-zinc-900">Job Booked!</p>
          <div className="text-xs leading-relaxed text-zinc-500">
            <p className="font-medium text-zinc-700">{CUSTOMER_NAME}</p>
            <p>Emergency Plumbing</p>
            <p>Today · 2:30 PM</p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-30">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-300">
            <Check className="h-5 w-5" />
          </span>
          <p className="text-xs text-zinc-300">Awaiting confirmation</p>
        </div>
      )}
    </div>
  );
}

function CalendarCard({ filled, reduceMotion }: { filled: boolean; reduceMotion: boolean }) {
  return (
    <div className="flex min-h-[230px] flex-1 flex-col justify-center gap-2">
      <CalendarStaticRow time="10:00 AM" title="Blocked Toilet" />
      <CalendarStaticRow time="11:30 AM" title="Leaking Tap" />
      <CalendarTargetRow filled={filled} reduceMotion={reduceMotion} />
      <CalendarStaticRow time="4:00 PM" title="Gas Fitting" />
    </div>
  );
}

function CalendarStaticRow({ time, title }: { time: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-14 shrink-0 text-[11px] font-medium text-zinc-400">{time}</span>
      <div className="min-w-0 flex-1 rounded-lg border border-zinc-100 bg-zinc-50/70 px-2.5 py-1.5">
        <p className="truncate text-xs font-medium text-zinc-500">{title}</p>
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
    <div className="flex items-center gap-2.5">
      <span className="w-14 shrink-0 text-[11px] font-semibold text-zinc-700">2:30 PM</span>
      <div className="min-w-0 flex-1">
        {filled ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.88, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 22 }
            }
            className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5"
          >
            <p className="truncate text-xs font-semibold text-zinc-900">{CUSTOMER_NAME}</p>
            <p className="truncate text-[10px] text-blue-600">Emergency Plumbing</p>
          </motion.div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 px-2.5 py-1.5">
            <p className="text-xs font-medium text-zinc-300">Available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PipelinePanel({
  stage,
  reduceMotion,
  layoutId,
}: {
  stage: Stage;
  reduceMotion: boolean;
  layoutId: string;
}) {
  return (
    <div className="flex min-h-[230px] flex-1 flex-col justify-center gap-1">
      {PIPELINE_STAGES.map((label, i) => {
        const status = i < stage ? "done" : i === stage ? "current" : "upcoming";
        return (
          <div key={label} className="flex items-center gap-2.5 py-1.5">
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                status === "done" && "border-emerald-500 bg-emerald-500 text-white",
                status === "current" && "border-blue-600 bg-blue-600 text-white",
                status === "upcoming" && "border-zinc-200 bg-white text-zinc-300",
              )}
            >
              {status === "done" ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                status === "upcoming" ? "text-zinc-300" : "text-zinc-700",
              )}
            >
              {label}
            </span>
            {status === "current" && (
              <motion.span
                layoutId={layoutId}
                transition={
                  reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }
                }
                className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
              >
                Sarah M.
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChatBubble({
  align,
  dur,
  children,
}: {
  align: "left" | "right";
  dur: (value: number) => number;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.35), ease: EASE }}
      className={cn(
        "w-fit max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-snug",
        align === "right"
          ? "ml-auto rounded-tr-sm bg-blue-600 text-white"
          : "rounded-tl-sm bg-zinc-100 text-zinc-700",
      )}
    >
      {children}
    </motion.div>
  );
}

function TypingIndicator({
  align,
  dur,
}: {
  align: "left" | "right";
  dur: (value: number) => number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.25), ease: EASE }}
      className={cn(
        "flex w-fit items-center gap-1 rounded-2xl px-3 py-2",
        align === "right" ? "ml-auto rounded-tr-sm bg-blue-600" : "rounded-tl-sm bg-zinc-100",
      )}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            align === "right" ? "bg-white/70" : "bg-zinc-400",
          )}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

/**
 * All demo sound is synthesised on the fly with the Web Audio API — no audio
 * files, nothing to license. Every cue is a short sine/triangle blip with a
 * quick attack and exponential decay so nothing clicks or lingers.
 */
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  options: { type?: OscillatorType; volume?: number; delay?: number } = {},
) {
  const { type = "sine", volume = 0.05, delay = 0 } = options;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playCue(ctx: AudioContext, key: PhaseKey) {
  switch (key) {
    case "ringing":
      playTone(ctx, 820, 0.16, { volume: 0.045 });
      break;
    case "missed":
      playTone(ctx, 300, 0.18, { volume: 0.04 });
      break;
    case "ai-msg-1":
    case "ai-msg-2":
      playTone(ctx, 520, 0.11, { volume: 0.045 });
      break;
    case "customer-msg-1":
    case "customer-msg-2":
      playTone(ctx, 640, 0.11, { volume: 0.045 });
      break;
    case "booked":
      playTone(ctx, 660, 0.14, { volume: 0.05 });
      playTone(ctx, 880, 0.16, { volume: 0.045, delay: 0.09 });
      break;
    case "calendar-fill":
      playTone(ctx, 980, 0.06, { type: "triangle", volume: 0.035 });
      break;
    case "crm-move":
      playTone(ctx, 460, 0.08, { type: "triangle", volume: 0.035 });
      break;
    default:
      break;
  }
}
