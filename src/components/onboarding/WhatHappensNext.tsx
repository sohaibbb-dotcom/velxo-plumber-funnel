import { Info } from "lucide-react";

export function WhatHappensNext() {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
      <p className="text-xs leading-relaxed text-white/50">
        <span className="font-medium text-white/75">What happens next? </span>
        We&apos;ll configure your AI receptionist, connect your number and pipeline, test the
        automations, and help you go live. Your card is not charged during the 30-day trial.
      </p>
    </div>
  );
}
