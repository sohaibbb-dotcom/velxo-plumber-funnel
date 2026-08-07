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
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
      <p className="text-sm text-zinc-500">
        Most businesses only need to upload one document. If your chosen document doesn&apos;t verify
        your business address, we&apos;ll ask for one additional proof-of-address document.
      </p>

      <label className="flex flex-col gap-1.5 text-left">
        <span className="text-sm font-medium text-zinc-700">Verification Document Type</span>
        <select
          required
          value={selectedType ?? ""}
          onChange={handleTypeChange}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
        >
          <option value="" disabled>
            Select a document type
          </option>
          {VERIFICATION_DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
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

      <p className="text-xs leading-relaxed text-zinc-400">
        <span className="font-medium text-zinc-500">Why we need this — </span>
        Australian telecommunications regulations require us to verify your business before
        provisioning your dedicated AI Receptionist phone number. Your document is stored securely
        and is used only for business verification.
      </p>

      {needsAddressProof && (
        <div className="flex flex-col gap-4 border-t border-zinc-200 pt-4">
          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-sm font-medium text-zinc-700">Proof of Business Address</span>
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
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            >
              <option value="" disabled>
                Select a document type
              </option>
              {ADDRESS_VERIFICATION_DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
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
    </div>
  );
}

// Re-exported for BusinessStep's meta/type-checking convenience.
export type { VerificationDocumentType };
