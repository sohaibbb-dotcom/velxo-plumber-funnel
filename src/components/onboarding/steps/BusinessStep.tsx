import { FormField } from "@/components/onboarding/FormField";
import { VerificationDocument } from "@/components/onboarding/VerificationDocument";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const BUSINESS_STEP_META = {
  title: "Verify your business",
  description:
    "We use these details to verify your business and provision your Velxo business phone number.",
};

export function BusinessStep({
  formData,
  update,
  setFormData,
}: {
  formData: OnboardingFormData;
  update: UpdateField;
  setFormData: (updater: (prev: OnboardingFormData) => OnboardingFormData) => void;
}) {
  return (
    <>
      <FormField
        label="Business / Legal Name"
        required
        value={formData.businessName}
        onChange={update("businessName")}
        placeholder="Mate's Plumbing & Gas Pty Ltd"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="ABN"
          required
          value={formData.abn}
          onChange={update("abn")}
          placeholder="12 345 678 901"
        />
        <FormField
          label="Business Address"
          required
          value={formData.businessAddress}
          onChange={update("businessAddress")}
          placeholder="1 Example St, Parramatta NSW"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Trading Name"
          optional
          value={formData.tradingName}
          onChange={update("tradingName")}
          placeholder="If different from your legal name"
        />
        <FormField
          label="Existing Website"
          optional
          value={formData.existingWebsite}
          onChange={update("existingWebsite")}
          placeholder="https://..."
        />
      </div>

      <VerificationDocument formData={formData} setFormData={setFormData} />
    </>
  );
}
