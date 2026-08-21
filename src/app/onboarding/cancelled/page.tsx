import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { CancelledRetry } from "@/components/onboarding/CancelledRetry";

export const metadata: Metadata = {
  title: "Checkout Cancelled — Velxo",
  robots: { index: false, follow: false },
};

export default function OnboardingCancelledPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-white/50">
        <XCircle className="h-7 w-7" />
      </span>
      <h1 className="max-w-md text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
        Checkout was cancelled.
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-white/55">
        No payment was made and your trial hasn&apos;t started. Your details are
        still saved — you can pick up right where you left off.
      </p>
      <CancelledRetry />
    </div>
  );
}
