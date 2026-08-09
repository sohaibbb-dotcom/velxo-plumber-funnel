import type { Metadata } from "next";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Welcome to Velxo — Quick Start",
  robots: { index: false, follow: false },
};

/**
 * Permanent, evergreen page linked from the customer welcome email's video
 * thumbnail — not part of the checkout/trial funnel, so it deliberately
 * takes no searchParams and makes no Supabase/Stripe/HighLevel calls. Reuses
 * the exact onboarding video already served on /onboarding/success
 * (public/videos/velxo-onboarding.mp4) rather than a second copy.
 */
export default function GetStartedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-14 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
        <Wrench className="h-4 w-4" />
      </span>

      <p className="mt-6 text-xs font-semibold tracking-widest text-blue-600 uppercase">Velxo Quick Start</p>
      <h1 className="mt-3 max-w-md text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        Welcome to Velxo
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-zinc-500">
        Watch this quick guide to get familiar with your Velxo system and know exactly what to do next.
      </p>

      <div className="mt-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]">
        <video className="aspect-video w-full" controls preload="metadata" playsInline>
          <source src="/videos/velxo-onboarding.mp4" type="video/mp4" />
        </video>
      </div>

      <p className="mt-4 text-sm text-zinc-400">Your Velxo login details are sent separately by SMS.</p>

      <p className="mt-10 max-w-sm text-sm leading-relaxed text-zinc-400">
        Need a hand? Our onboarding team is here to help — just reply to any of our messages and we&apos;ll sort it
        out.
      </p>
    </div>
  );
}
