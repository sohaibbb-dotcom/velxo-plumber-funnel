import { FormField, FormTextArea } from "@/components/onboarding/FormField";
import { ServiceCheckboxes } from "@/components/onboarding/ServiceCheckboxes";
import { YesNoToggle } from "@/components/onboarding/YesNoToggle";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const AI_SETUP_STEP_META = {
  title: "Teach your AI",
  description: "This is exactly what your AI Receptionist will use to handle calls and bookings.",
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
      <FormField
        label="Business Opening Hours"
        required
        value={formData.openingHours}
        onChange={update("openingHours")}
        placeholder="Mon–Fri 7am–5pm, closed weekends"
      />
      <YesNoToggle
        label="Do you offer emergency / after-hours service?"
        name="offersEmergencyService"
        value={formData.offersEmergencyService}
        onChange={(value) => setFormData((prev) => ({ ...prev, offersEmergencyService: value }))}
      />
      <FormField
        label="How do customers currently book jobs?"
        required
        value={formData.bookingMethod}
        onChange={update("bookingMethod")}
        placeholder="Phone call, text message, online form..."
      />
      <YesNoToggle
        label="Should the AI offer specific appointment times?"
        name="aiOffersBookingTimes"
        value={formData.aiOffersBookingTimes}
        onChange={(value) => setFormData((prev) => ({ ...prev, aiOffersBookingTimes: value }))}
      />
      <FormField
        label="Where should new AI-booked jobs go?"
        required
        value={formData.bookingDestination}
        onChange={update("bookingDestination")}
        placeholder="e.g. Add to my Velxo pipeline, text me directly..."
      />
      <FormField
        label="What should happen with urgent/emergency jobs?"
        required
        value={formData.urgentJobHandling}
        onChange={update("urgentJobHandling")}
        placeholder="e.g. Call me immediately, text the on-call tech..."
      />
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
      <FormField
        label="Google Business Profile Link"
        optional
        value={formData.googleLink}
        onChange={update("googleLink")}
        placeholder="https://g.page/..."
      />
      <FormTextArea
        label="Anything important the AI should know?"
        optional
        value={formData.notes}
        onChange={update("notes")}
        placeholder="Pricing quirks, areas you don't service, anything else..."
      />
    </>
  );
}
