import { useState } from "react";
import { FormField } from "@/components/onboarding/FormField";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

export const CONTACT_STEP_META = {
  title: "Contact & notifications",
  description: "Who operates the system, and where they should be notified.",
};

export function ContactStep({
  formData,
  update,
  setFormData,
}: {
  formData: OnboardingFormData;
  update: UpdateField;
  setFormData: (updater: (prev: OnboardingFormData) => OnboardingFormData) => void;
}) {
  const [sameAsBusinessPhone, setSameAsBusinessPhone] = useState(false);

  const toggleSameAsBusinessPhone = (checked: boolean) => {
    setSameAsBusinessPhone(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, notificationMobile: prev.businessPhone }));
    }
  };

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
          onChange={(e) => {
            update("businessPhone")(e);
            if (sameAsBusinessPhone) {
              setFormData((prev) => ({ ...prev, notificationMobile: e.target.value }));
            }
          }}
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
      <FormField
        label="Preferred Notification Mobile"
        type="tel"
        required
        disabled={sameAsBusinessPhone}
        value={formData.notificationMobile}
        onChange={update("notificationMobile")}
        placeholder="Where we'll alert you about missed calls and jobs"
      />
      <label className="-mt-2 flex items-center gap-2 text-sm text-zinc-500">
        <input
          type="checkbox"
          checked={sameAsBusinessPhone}
          onChange={(e) => toggleSameAsBusinessPhone(e.target.checked)}
        />
        Same as business phone
      </label>
    </>
  );
}
