import { FormField, FormTextArea } from "@/components/onboarding/FormField";
import { ServiceCheckboxes } from "@/components/onboarding/ServiceCheckboxes";
import { YesNoToggle } from "@/components/onboarding/YesNoToggle";
import { BusinessHoursPicker } from "@/components/onboarding/BusinessHoursPicker";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const AI_SETUP_STEP_META = {
  title: "Help us personalise your AI Receptionist",
  description: "Takes about a minute — this is what we use to prepare your account before your free trial begins.",
};

export function AiSetupStep({
  formData,
  update,
  toggleService,
  setFormData,
}: {
  formData: OnboardingFormData;
  update: UpdateField;
  toggleService: (service: string) => void;
  setFormData: (updater: (prev: OnboardingFormData) => OnboardingFormData) => void;
}) {
  return (
    <>
      <ServiceCheckboxes selected={formData.services} onToggle={toggleService} />
      <FormField
        label="Service Suburbs / Area"
        required
        value={formData.suburbsCovered}
        onChange={update("suburbsCovered")}
        placeholder="Parramatta, Blacktown, Penrith"
      />
      <BusinessHoursPicker formData={formData} setFormData={setFormData} />
      <YesNoToggle
        label="Should we forward your existing business phone number, instead of issuing a new Velxo number?"
        name="useExistingNumber"
        value={formData.useExistingNumber}
        onChange={(value) => setFormData((prev) => ({ ...prev, useExistingNumber: value }))}
      />
      {formData.useExistingNumber && (
        <FormField
          label="Number Porting Notes"
          optional
          value={formData.numberPortingNotes}
          onChange={update("numberPortingNotes")}
          placeholder="Current provider, any porting details we should know"
        />
      )}
      <div className="flex flex-col gap-1.5">
        <FormField
          label="Google Business Profile / Review Link *"
          type="url"
          required
          value={formData.googleLink}
          onChange={update("googleLink")}
          placeholder="https://g.page/r/..."
        />
        <p className="text-xs text-zinc-400">
          We use this link when automatically asking your customers for a Google review.
        </p>
      </div>
      <FormTextArea
        label="Anything else we should know?"
        optional
        value={formData.notes}
        onChange={update("notes")}
        placeholder="e.g. suburbs you don't cover, pricing notes, anything else useful"
      />
    </>
  );
}
