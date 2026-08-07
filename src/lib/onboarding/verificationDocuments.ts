/**
 * Single source of truth for business-verification document types — used by
 * both the onboarding wizard (client) and /api/onboarding-submissions
 * (server) so the accepted values and the "does this type already prove the
 * operating address" rule can never drift apart between the two.
 */

export const VERIFICATION_DOCUMENT_TYPES = [
  "abn_registration_asic_extract",
  "business_licence",
  "electricity_bill",
  "gas_bill",
  "water_bill",
  "internet_nbn_bill",
  "council_rates_notice",
  "commercial_lease_agreement",
  "bank_statement",
  "other",
] as const;

export type VerificationDocumentType = (typeof VERIFICATION_DOCUMENT_TYPES)[number];

export const VERIFICATION_DOCUMENT_LABELS: Record<VerificationDocumentType, string> = {
  abn_registration_asic_extract: "ABN Registration / ASIC Business Extract",
  business_licence: "Business Licence",
  electricity_bill: "Electricity Bill",
  gas_bill: "Gas Bill",
  water_bill: "Water Bill",
  internet_nbn_bill: "Internet / NBN Bill",
  council_rates_notice: "Council Rates Notice",
  commercial_lease_agreement: "Commercial Lease Agreement",
  bank_statement: "Bank Statement (showing business name and business address)",
  other: "Other Business Verification Document",
};

/**
 * Document types that, on their own, prove the business exists, the
 * document belongs to it, AND the operating address — so no second upload
 * is needed. Everything else (identity-only documents, plus "other" since
 * its contents are unknown) requires a second Proof of Business Address
 * upload. Business Licence is deliberately kept on the "insufficient" side:
 * licence formats vary by state/trade and don't reliably show a premises
 * address.
 */
const ADDRESS_SUFFICIENT_TYPES = new Set<VerificationDocumentType>([
  "electricity_bill",
  "gas_bill",
  "water_bill",
  "internet_nbn_bill",
  "council_rates_notice",
  "commercial_lease_agreement",
  "bank_statement",
]);

export const ADDRESS_VERIFICATION_DOCUMENT_TYPES = [
  "electricity_bill",
  "gas_bill",
  "water_bill",
  "internet_nbn_bill",
  "council_rates_notice",
  "commercial_lease_agreement",
  "bank_statement",
] as const;

export type AddressVerificationDocumentType = (typeof ADDRESS_VERIFICATION_DOCUMENT_TYPES)[number];

export const ADDRESS_VERIFICATION_DOCUMENT_LABELS: Record<AddressVerificationDocumentType, string> = {
  electricity_bill: "Electricity Bill",
  gas_bill: "Gas Bill",
  water_bill: "Water Bill",
  internet_nbn_bill: "Internet / NBN Bill",
  council_rates_notice: "Council Rates Notice",
  commercial_lease_agreement: "Commercial Lease Agreement",
  bank_statement: "Bank Statement showing the business address",
};

export function isVerificationDocumentType(value: unknown): value is VerificationDocumentType {
  return typeof value === "string" && (VERIFICATION_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function isAddressVerificationDocumentType(value: unknown): value is AddressVerificationDocumentType {
  return (
    typeof value === "string" &&
    (ADDRESS_VERIFICATION_DOCUMENT_TYPES as readonly string[]).includes(value)
  );
}

/** Whether the second "Proof of Business Address" upload is required for the given primary document type. */
export function requiresAddressProof(type: VerificationDocumentType): boolean {
  return !ADDRESS_SUFFICIENT_TYPES.has(type);
}
