import { FormField } from "@/components/onboarding/FormField";
import { VerificationDocument } from "@/components/onboarding/VerificationDocument";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const BUSINESS_STEP_META = {
  title: "Verify your business",
  description: "Required before we can provision your business phone/SMS setup.",
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
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="ABN"
          required
          inputMode="numeric"
          value={formData.abn}
          onChange={update("abn")}
          placeholder="12 345 678 901"
        />
        <FormField
          label="Business Address"
          required
          autoComplete="street-address"
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
        <div className="flex flex-col gap-1.5">
          <FormField
            label="Website"
            optional
            type="url"
            autoComplete="url"
            value={formData.existingWebsite}
            onChange={update("existingWebsite")}
            placeholder="https://..."
          />
          <p className="text-xs text-white/35">
            We&apos;ll use this to learn about your business and prepare your AI Receptionist.
          </p>
        </div>
      </div>

      <VerificationDocument formData={formData} setFormData={setFormData} />
    </>
  );
}
