import { Check } from "lucide-react";
import { FormField } from "@/components/onboarding/FormField";
import { PLAN_LABELS, type Plan } from "@/lib/plans";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const REVIEW_ACTIVATE_STEP_META = {
  title: "Review & finish setup",
  description: "Last check before we get your AI Receptionist configured and live.",
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
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold tracking-widest text-white/45 uppercase">
          Activating {PLAN_LABELS[plan]}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {ACTIVATION_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-white/80">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={4} />
              </span>
              {item}
            </li>
          ))}
        </ul>
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
