import { FormField, FormTextArea } from "@/components/onboarding/FormField";
import { BrandColorPicker } from "@/components/onboarding/BrandColorPicker";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const BRAND_STEP_META = {
  eyebrow: "Step 4 of 4",
  title: "Brand & final details",
  description: "Last step — then it's straight to secure payment for your 30-day free trial.",
};

export function BrandStep({
  formData,
  update,
  onColourChange,
}: {
  formData: OnboardingFormData;
  update: UpdateField;
  onColourChange: (name: string) => void;
}) {
  return (
    <>
      <BrandColorPicker value={formData.colourScheme} onChange={onColourChange} />
      <FormField
        label="Google Business Profile Link"
        optional
        value={formData.googleLink}
        onChange={update("googleLink")}
        placeholder="https://g.page/..."
      />
      <FormTextArea
        label="Anything else we should know?"
        optional
        value={formData.notes}
        onChange={update("notes")}
        placeholder="Tell us about your business..."
      />
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
