import { ShieldCheck } from "lucide-react";
import { PLAN_MONTHLY_PRICE_AUD, type Plan } from "@/lib/plans";

export function TrialReassurance({ plan }: { plan: Plan }) {
  const price = PLAN_MONTHLY_PRICE_AUD[plan];

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
        <ShieldCheck className="h-4 w-4" />
        30 days free
      </div>
      <p className="mt-1.5 text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">$0 today.</span> Then A${price}/month. Cancel
        anytime during your trial.
      </p>
    </div>
  );
}
