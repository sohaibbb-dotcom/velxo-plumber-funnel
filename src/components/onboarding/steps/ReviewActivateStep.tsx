import { Check } from "lucide-react";
import { FormField } from "@/components/onboarding/FormField";
import { PLAN_LABELS, PLAN_MONTHLY_PRICE_AUD, type Plan } from "@/lib/plans";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const REVIEW_ACTIVATE_STEP_META = {
  title: "Review & activate",
  description: "Here's exactly what Velxo is about to switch on for your business.",
};

const ACTIVATION_ITEMS = [
  "Instant missed-call responses",
  "AI qualification & follow-up",
  "Booking automation",
  "CRM & pipeline",
  "Review automation",
];

export function ReviewActivateStep({
  formData,
  update,
  plan,
}: {
  formData: OnboardingFormData;
  update: UpdateField;
  plan: Plan;
}) {
  const price = PLAN_MONTHLY_PRICE_AUD[plan];

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
        <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Activating {PLAN_LABELS[plan]}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {ACTIVATION_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-700">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={4} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-center">
        <p className="text-lg font-semibold text-zinc-900">$0 today · 30 days free</p>
        <p className="mt-1 text-sm text-zinc-600">
          Then A${price}/month. Cancel anytime during your trial.
        </p>
      </div>

      <FormField
        label="How did you hear about us?"
        optional
        value={formData.referralSource}
        onChange={update("referralSource")}
        placeholder="Google, referral, Facebook ad..."
      />
    </>
  );
}
