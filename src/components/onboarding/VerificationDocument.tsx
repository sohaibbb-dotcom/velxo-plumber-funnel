import { Check } from "lucide-react";
import { FormField } from "@/components/onboarding/FormField";
import { FileUpload } from "@/components/onboarding/FileUpload";
import {
  VERIFICATION_DOCUMENT_TYPES,
  VERIFICATION_DOCUMENT_LABELS,
  ADDRESS_VERIFICATION_DOCUMENT_TYPES,
  ADDRESS_VERIFICATION_DOCUMENT_LABELS,
  isVerificationDocumentType,
  isAddressVerificationDocumentType,
  requiresAddressProof,
  type VerificationDocumentType,
} from "@/lib/onboarding/verificationDocuments";
import type { OnboardingFormData } from "@/components/onboarding/types";

export function VerificationDocument({
  formData,
  setFormData,
}: {
  formData: OnboardingFormData;
  setFormData: (updater: (prev: OnboardingFormData) => OnboardingFormData) => void;
}) {
  const selectedType = formData.verificationDocumentType;
  const needsAddressProof = selectedType ? requiresAddressProof(selectedType) : false;
  const verificationComplete =
    !!formData.verificationDocumentPath &&
    (selectedType !== "other" || !!formData.verificationDocumentOtherDescription) &&
    (!needsAddressProof || !!formData.addressVerificationDocumentPath);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const nextType = isVerificationDocumentType(next) ? next : null;
    setFormData((prev) => ({
      ...prev,
      // Changing the type never touches the already-uploaded file/path —
      // only the type itself changes here.
      verificationDocumentType: nextType,
      // "Other" description only ever applies to the "other" type.
      verificationDocumentOtherDescription:
        nextType === "other" ? prev.verificationDocumentOtherDescription : "",
    }));
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-sm font-semibold text-white">Business Verification</p>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">
          Australian telecommunications regulations require us to verify your business before we can
          activate your dedicated AI Receptionist phone number. This usually takes less than 30
          seconds.
        </p>
      </div>

      <p className="text-sm text-white/50">
        Most businesses only need to upload one document. If your chosen document doesn&apos;t verify
        your business address, we&apos;ll ask for one additional proof-of-address document.
      </p>

      <label className="flex flex-col gap-1.5 text-left">
        <span className="text-sm font-medium text-white/75">
          Verification Document Type<span className="ml-1 text-violet-400">*</span>
        </span>
        <select
          required
          value={selectedType ?? ""}
          onChange={handleTypeChange}
          className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white outline-none transition-colors [color-scheme:dark] focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-400/20"
        >
          <option value="" disabled className="bg-zinc-900">
            Select a document type
          </option>
          {VERIFICATION_DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type} className="bg-zinc-900">
              {VERIFICATION_DOCUMENT_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      {selectedType === "other" && (
        <FormField
          label="Please specify the document type"
          required
          value={formData.verificationDocumentOtherDescription}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, verificationDocumentOtherDescription: e.target.value }))
          }
          placeholder="e.g. Insurance certificate of currency"
        />
      )}

      <FileUpload
        label="Upload Verification Document"
        required
        value={formData.verificationDocumentPath}
        fileName={formData.verificationDocumentFileName}
        onUploaded={(path, fileName) =>
          setFormData((prev) => ({
            ...prev,
            verificationDocumentPath: path,
            verificationDocumentFileName: fileName,
          }))
        }
        onRemoved={() =>
          setFormData((prev) => ({
            ...prev,
            verificationDocumentPath: null,
            verificationDocumentFileName: null,
          }))
        }
      />

      {needsAddressProof && (
        <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-sm font-medium text-white/75">
              Proof of Business Address<span className="ml-1 text-violet-400">*</span>
            </span>
            <select
              required
              value={formData.addressVerificationDocumentType ?? ""}
              onChange={(e) => {
                const next = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  addressVerificationDocumentType: isAddressVerificationDocumentType(next) ? next : null,
                }));
              }}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white outline-none transition-colors [color-scheme:dark] focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-400/20"
            >
              <option value="" disabled className="bg-zinc-900">
                Select a document type
              </option>
              {ADDRESS_VERIFICATION_DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type} className="bg-zinc-900">
                  {ADDRESS_VERIFICATION_DOCUMENT_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <FileUpload
            label="Upload Proof of Business Address"
            required
            value={formData.addressVerificationDocumentPath}
            fileName={formData.addressVerificationDocumentFileName}
            onUploaded={(path, fileName) =>
              setFormData((prev) => ({
                ...prev,
                addressVerificationDocumentPath: path,
                addressVerificationDocumentFileName: fileName,
              }))
            }
            onRemoved={() =>
              setFormData((prev) => ({
                ...prev,
                addressVerificationDocumentPath: null,
                addressVerificationDocumentFileName: null,
              }))
            }
          />
        </div>
      )}

      {verificationComplete && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={3} />
          <p className="text-sm leading-relaxed text-white/75">
            <span className="font-medium text-white">Business verification received.</span> Our
            onboarding team will verify your documents before provisioning your dedicated AI
            Receptionist number.
          </p>
        </div>
      )}
    </div>
  );
}

// Re-exported for BusinessStep's meta/type-checking convenience.
export type { VerificationDocumentType };
