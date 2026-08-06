import { FormField } from "@/components/onboarding/FormField";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const BUSINESS_STEP_META = {
  eyebrow: "Step 1 of 4",
  title: "Tell us about your business",
  description: "We'll use this to set up your Velxo account.",
};

export function BusinessStep({
  formData,
  update,
}: {
  formData: OnboardingFormData;
  update: UpdateField;
}) {
  return (
    <>
      <FormField
        label="Business Name"
        required
        value={formData.businessName}
        onChange={update("businessName")}
        placeholder="Mate's Plumbing & Gas"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="ABN"
          optional
          value={formData.abn}
          onChange={update("abn")}
          placeholder="12 345 678 901"
        />
        <FormField
          label="Business Address"
          optional
          value={formData.businessAddress}
          onChange={update("businessAddress")}
          placeholder="1 Example St, Parramatta NSW"
        />
      </div>
    </>
  );
}
