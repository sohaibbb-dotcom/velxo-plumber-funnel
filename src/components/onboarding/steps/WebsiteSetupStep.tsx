import { X } from "lucide-react";
import { FormTextArea } from "@/components/onboarding/FormField";
import { BrandColorPicker } from "@/components/onboarding/BrandColorPicker";
import { FileUpload } from "@/components/onboarding/FileUpload";
import type { OnboardingFormData } from "@/components/onboarding/types";

export const WEBSITE_SETUP_STEP_META = {
  title: "Website setup",
  description: "Everything we need to design and build your new website.",
};

/** Complete-plan only — AI Receptionist customers never render this step. */
export function WebsiteSetupStep({
  formData,
  setFormData,
  onColourChange,
}: {
  formData: OnboardingFormData;
  setFormData: (updater: (prev: OnboardingFormData) => OnboardingFormData) => void;
  onColourChange: (name: string) => void;
}) {
  return (
    <>
      <BrandColorPicker value={formData.colourScheme} onChange={onColourChange} />

      <FileUpload
        label="Logo"
        value={formData.logoPath}
        fileName={formData.logoFileName}
        onUploaded={(path, fileName) =>
          setFormData((prev) => ({ ...prev, logoPath: path, logoFileName: fileName }))
        }
        onRemoved={() => setFormData((prev) => ({ ...prev, logoPath: null, logoFileName: null }))}
      />

      <div className="flex flex-col gap-1.5 text-left">
        <span className="text-sm font-medium text-white/75">
          Website Photos <span className="font-normal text-white/35">(optional)</span>
        </span>
        {formData.websitePhotoPaths.map((photo, i) => (
          <div
            key={photo.path}
            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-2.5"
          >
            <span className="truncate text-sm text-white/85">{photo.fileName}</span>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  websitePhotoPaths: prev.websitePhotoPaths.filter((_, idx) => idx !== i),
                }))
              }
              aria-label="Remove photo"
              className="shrink-0 text-white/35 hover:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <FileUpload
          label="Add a photo"
          value={null}
          fileName={null}
          onUploaded={(path, fileName) =>
            setFormData((prev) => ({
              ...prev,
              websitePhotoPaths: [...prev.websitePhotoPaths, { path, fileName }],
            }))
          }
          onRemoved={() => {}}
        />
      </div>

      <FormTextArea
        label="Website preferences / content notes"
        optional
        value={formData.websiteNotes}
        onChange={(e) => setFormData((prev) => ({ ...prev, websiteNotes: e.target.value }))}
        placeholder="Pages you need, competitor sites you like, content to reuse..."
      />
    </>
  );
}
