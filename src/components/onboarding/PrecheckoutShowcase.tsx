import { Bot, PhoneMissed, Check } from "lucide-react";

/**
 * Left-column marketing panel for the minimal pre-checkout screen
 * (OnboardingFlow). Deliberately NOT the full looping HeroProductDemo used
 * on the homepage — that's a ~14s multi-phase animated story, too heavy for
 * a screen whose whole job is to get out of the way in ~30-45s. This is a
 * single static frame told in the same visual language (phone chrome, chat
 * bubble colours, the emerald "booked" chip) so the story reads at a glance
 * without any timer or loop.
 */

const BENEFITS = [
  "AI Missed Call Replies",
  "AI Booking Assistant",
  "Automated Follow-Ups",
  "Google Review Requests",
];

export function PrecheckoutShowcase() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
          Start your 30-day free trial
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/55">
          Velxo answers missed calls instantly, texts the customer back, and books the job —
          automatically, day or night.
        </p>
      </div>

      <WorkflowPreview />

      <ul className="hidden flex-col gap-2.5 lg:flex">
        {BENEFITS.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-white/75">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A compact, static "highlight frame" of the homepage phone story — missed
 * call, AI's instant reply, the customer's response, job booked — all
 * visible at once rather than played out over time.
 */
function WorkflowPreview() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 border-b border-white/5 px-4 pt-3.5 pb-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white">
          <Bot className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-white">Velxo AI</p>
          <p className="truncate text-[10px] text-white/40">AI Receptionist</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Online
        </span>
      </div>

      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/90 text-white">
            <PhoneMissed className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white">Missed call</p>
            <p className="truncate text-[10px] text-red-300/80">10:24 AM</p>
          </div>
        </div>

        <div className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 px-3 py-1.5 text-[12px] leading-snug text-white/85">
          Sorry we missed your call — how can we help?
        </div>
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1.5 text-[12px] leading-snug text-white">
          Hot water system just died.
        </div>

        <div className="mx-auto mt-1 flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1.5 text-[12px] font-semibold text-emerald-300">
          <Check className="h-3 w-3" strokeWidth={3} />
          Job booked · 2:30 PM
        </div>
      </div>
    </div>
  );
}
