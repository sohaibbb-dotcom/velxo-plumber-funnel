import { useState } from "react";
import { FormField, FormTextArea } from "@/components/onboarding/FormField";
import { ServiceCheckboxes } from "@/components/onboarding/ServiceCheckboxes";
import { YesNoToggle } from "@/components/onboarding/YesNoToggle";
import { BusinessHoursPicker } from "@/components/onboarding/BusinessHoursPicker";
import { GoogleBusinessProfileConnect } from "@/components/onboarding/GoogleBusinessProfileConnect";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const AI_SETUP_STEP_META = {
  title: "Help us personalise your AI Receptionist",
  description: "Takes about a minute — this is what we use to configure your account and go live.",
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
  // Defaults to true whenever a notification mobile hasn't been typed yet —
  // formData.notificationMobile is pre-filled with the already-known
  // business phone (see FinishSetupFlow), so this starts checked/in-sync
  // rather than forcing a redundant re-type of the same number.
  const [sameAsBusinessPhone, setSameAsBusinessPhone] = useState(true);

  const toggleSameAsBusinessPhone = (checked: boolean) => {
    setSameAsBusinessPhone(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, notificationMobile: prev.businessPhone }));
    }
  };

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
          label="Preferred Notification Mobile"
          type="tel"
          required
          autoComplete="tel"
          disabled={sameAsBusinessPhone}
          value={formData.notificationMobile}
          onChange={update("notificationMobile")}
          placeholder="Where we'll alert you about missed calls and jobs"
        />
        <label className="flex items-center gap-2 text-sm text-white/50">
          <input
            type="checkbox"
            checked={sameAsBusinessPhone}
            onChange={(e) => toggleSameAsBusinessPhone(e.target.checked)}
            className="accent-violet-500"
          />
          Same as business phone
        </label>
      </div>
      <GoogleBusinessProfileConnect formData={formData} setFormData={setFormData} />
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
