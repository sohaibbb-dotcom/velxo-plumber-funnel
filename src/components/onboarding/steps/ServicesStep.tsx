import { FormField } from "@/components/onboarding/FormField";
import { ServiceCheckboxes } from "@/components/onboarding/ServiceCheckboxes";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const SERVICES_STEP_META = {
  eyebrow: "Step 3 of 4",
  title: "What do you offer?",
  description: "Helps us tailor your AI Receptionist's scripts and booking flow.",
};

export function ServicesStep({
  formData,
  update,
  toggleService,
}: {
  formData: OnboardingFormData;
  update: UpdateField;
  toggleService: (service: string) => void;
}) {
  return (
    <>
      <ServiceCheckboxes selected={formData.services} onToggle={toggleService} />
      <FormField
        label="Suburbs Covered"
        optional
        value={formData.suburbsCovered}
        onChange={update("suburbsCovered")}
        placeholder="Parramatta, Blacktown, Penrith"
      />
    </>
  );
}
