import { FormField } from "@/components/onboarding/FormField";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const CONTACT_STEP_META = {
  eyebrow: "Step 2 of 4",
  title: "Who should we contact?",
  description: "This is who Velxo will reach out to for setup and support.",
};

export function ContactStep({
  formData,
  update,
}: {
  formData: OnboardingFormData;
  update: UpdateField;
}) {
  return (
    <>
      <FormField
        label="Owner / Contact Name"
        required
        value={formData.ownerName}
        onChange={update("ownerName")}
        placeholder="Alex Mate"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Business Phone"
          type="tel"
          required
          value={formData.businessPhone}
          onChange={update("businessPhone")}
          placeholder="0400 000 000"
        />
        <FormField
          label="Business Email"
          type="email"
          required
          value={formData.businessEmail}
          onChange={update("businessEmail")}
          placeholder="you@business.com.au"
        />
      </div>
    </>
  );
}
