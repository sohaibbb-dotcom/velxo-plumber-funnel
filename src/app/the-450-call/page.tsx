import type { Metadata } from "next";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "The $450 Call — Velxo",
  description:
    "A 26-second look at what one missed call can cost an Australian plumber — and what happens when Velxo answers it instead.",
  robots: { index: false, follow: false },
};

/**
 * Permanent, evergreen landing target for the "$450 Missed Call" video linked
 * from cold outreach emails (GHL). Mirrors /get-started: no searchParams, and
 * no Supabase/Stripe/HighLevel calls — it is deliberately outside the
 * checkout/trial funnel and only links across to the existing /onboarding
 * route. The video is the approved V4 master served from
 * public/videos/velxo-450-call.mp4.
 *
 * The creative is 9:16, so the player is width-constrained rather than
 * full-bleed; `poster` means the first frame paints before any of the 4.7 MB
 * downloads, and `preload="metadata"` keeps the page cheap for recipients
 * opening it on mobile data.
 */
export default function The450CallPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-14 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
        <Wrench className="h-4 w-4" />
      </span>

      <p className="mt-6 text-xs font-semibold tracking-widest text-blue-600 uppercase">Velxo</p>
      <h1 className="mt-3 max-w-md text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        The $450 call you didn&apos;t know you missed
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-zinc-500">
        26 seconds on what one missed call really costs — and what happens when Velxo picks it up instead.
      </p>

      <div className="mt-8 w-full max-w-[340px] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]">
        <video
          className="aspect-[9/16] w-full"
          controls
          preload="metadata"
          playsInline
          poster="/videos/velxo-450-call-poster.jpg"
        >
          <source src="/videos/velxo-450-call.mp4" type="video/mp4" />
        </video>
      </div>

      <a
        href="/onboarding?plan=ai_receptionist"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Start My Free 30-Day Trial
      </a>
      <p className="mt-3 text-sm text-zinc-400">
        30 days free · Then A$297/month · No charge today · Cancel anytime before your trial ends
      </p>

      <p className="mt-10 max-w-sm text-sm leading-relaxed text-zinc-400">
        The $450 figure is an illustrative example, not a guarantee — job values vary.
      </p>
    </div>
  );
}
