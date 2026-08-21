import { ShieldCheck } from "lucide-react";
import { PLAN_MONTHLY_PRICE_AUD, type Plan } from "@/lib/plans";

export function TrialReassurance({ plan }: { plan: Plan }) {
  const price = PLAN_MONTHLY_PRICE_AUD[plan];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
        <ShieldCheck className="h-4 w-4" />
        30 days free
      </div>
      <p className="mt-1.5 text-sm text-white/60">
        <span className="font-medium text-white">$0 today.</span> Then A${price}/month. Cancel before
        your trial ends and pay nothing.
      </p>
    </div>
  );
}
