import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";
import { FormField, FormTextArea } from "@/components/onboarding/FormField";
import { ServiceCheckboxes } from "@/components/onboarding/ServiceCheckboxes";
import { YesNoToggle } from "@/components/onboarding/YesNoToggle";
import { BusinessHoursPicker } from "@/components/onboarding/BusinessHoursPicker";
import type { OnboardingFormData, UpdateField } from "@/components/onboarding/types";

/**
 * Business owners often don't know offhand where their Google review link
 * lives — this stays a plain inline disclosure (not a modal) so it works the
 * same way at any viewport width with no backdrop/focus-trap to build, and
 * matches WhatHappensNext's existing "info card" visual language.
 */
function GoogleReviewLinkHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="self-start text-xs font-medium text-blue-600 underline decoration-blue-200 underline-offset-2 transition-colors hover:text-blue-700"
      >
        How do I find this?
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-3.5 text-left"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div className="text-xs leading-relaxed text-zinc-500">
              <ol className="list-decimal space-y-1 pl-4">
                <li>Open your Google Business Profile.</li>
                <li>Select &quot;Ask for reviews&quot;.</li>
                <li>Copy your review link and paste it here.</li>
              </ol>
              <p className="mt-2 text-zinc-400">
                The link usually starts with https://g.page/r/ or a Google review/share URL.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
          label="Google Review Link *"
          type="url"
          required
          value={formData.googleLink}
          onChange={update("googleLink")}
          placeholder="https://g.page/r/..."
        />
        <p className="text-xs text-zinc-400">
          We use this link when automatically asking your customers for a Google review.
        </p>
        <GoogleReviewLinkHelp />
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
