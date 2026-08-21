import {
  isVerificationDocumentType,
  isAddressVerificationDocumentType,
  requiresAddressProof,
} from "@/lib/onboarding/verificationDocuments";
import { asString, asStringArray, asBoolean, stripHtml, isValidHttpUrl } from "@/lib/onboarding/sanitize";
import type { VerificationDocumentType, AddressVerificationDocumentType } from "@/lib/onboarding/verificationDocuments";

/**
 * Phase 2 ("Finish Setup") field validation — moved verbatim out of
 * /api/onboarding-submissions's old isNewWizard branch when the funnel was
 * split into a minimal pre-Stripe create and a post-Stripe update. Used only
 * by /api/onboarding-setup. Phase 1 (business_name, owner_name,
 * business_email, business_phone) is validated separately, inline, in
 * /api/onboarding-submissions — those fields already exist on the row by the
 * time this runs and are never re-sent here.
 */

const MAX_LENGTHS = {
  abn: 32,
  businessAddress: 300,
  suburbsCovered: 1000,
  googleLink: 500,
  notes: 2000,
  referralSource: 200,
  tradingName: 200,
  existingWebsite: 500,
  notificationMobile: 32,
  openingHours: 500,
  numberPortingNotes: 1000,
  websiteNotes: 2000,
  verificationDocumentOtherDescription: 200,
} as const;

export type Phase2RequestBody = {
  abn?: unknown;
  businessAddress?: unknown;
  tradingName?: unknown;
  existingWebsite?: unknown;
  notificationMobile?: unknown;
  suburbsCovered?: unknown;
  openingHours?: unknown;
  useExistingNumber?: unknown;
  numberPortingNotes?: unknown;
  services?: unknown;
  colourScheme?: unknown;
  googleLink?: unknown;
  notes?: unknown;
  referralSource?: unknown;
  logoPath?: unknown;
  websitePhotoPaths?: unknown;
  websiteNotes?: unknown;
  verificationDocumentType?: unknown;
  verificationDocumentPath?: unknown;
  verificationDocumentOtherDescription?: unknown;
  addressVerificationDocumentType?: unknown;
  addressVerificationDocumentPath?: unknown;
};

export type Phase2Fields = {
  abn: string;
  businessAddress: string;
  tradingName: string | null;
  existingWebsite: string | null;
  notificationMobile: string;
  suburbsCovered: string;
  openingHours: string;
  useExistingNumber: boolean;
  numberPortingNotes: string | null;
  services: string[];
  colourScheme: string | null;
  googleLink: string | null;
  notes: string | null;
  referralSource: string | null;
  logoPath: string | null;
  websitePhotoPaths: string[];
  websiteNotes: string | null;
  verificationDocumentType: VerificationDocumentType;
  verificationDocumentPath: string;
  verificationDocumentOtherDescription: string | null;
  addressVerificationDocumentType: AddressVerificationDocumentType | null;
  addressVerificationDocumentPath: string | null;
};

export type Phase2ValidationResult =
  | { success: true; fields: Phase2Fields }
  | { success: false; error: string };

export function validatePhase2Fields(body: Phase2RequestBody): Phase2ValidationResult {
  const abn = stripHtml(asString(body.abn));
  const businessAddress = stripHtml(asString(body.businessAddress));
  const tradingName = stripHtml(asString(body.tradingName)) || null;
  const existingWebsite = asString(body.existingWebsite) || null;
  const notificationMobile = asString(body.notificationMobile);
  const suburbsCovered = stripHtml(asString(body.suburbsCovered));
  const openingHours = stripHtml(asString(body.openingHours));
  const useExistingNumber = asBoolean(body.useExistingNumber);
  const numberPortingNotes = stripHtml(asString(body.numberPortingNotes)) || null;
  const services = asStringArray(body.services);
  const colourScheme = stripHtml(asString(body.colourScheme)) || null;
  const googleLink = asString(body.googleLink) || null;
  const notes = stripHtml(asString(body.notes)) || null;
  const referralSource = stripHtml(asString(body.referralSource)) || null;
  const logoPath = asString(body.logoPath) || null;
  const websitePhotoPaths = asStringArray(body.websitePhotoPaths);
  const websiteNotes = stripHtml(asString(body.websiteNotes)) || null;

  const rawVerificationDocumentType = body.verificationDocumentType;
  const verificationDocumentType = isVerificationDocumentType(rawVerificationDocumentType)
    ? rawVerificationDocumentType
    : null;
  const verificationDocumentPath = asString(body.verificationDocumentPath) || null;
  // Only ever stored for "other" — forced null for every other type,
  // regardless of what the client sent, per spec.
  const verificationDocumentOtherDescription =
    verificationDocumentType === "other"
      ? stripHtml(asString(body.verificationDocumentOtherDescription)) || null
      : null;

  const documentRequiresAddressProof = verificationDocumentType
    ? requiresAddressProof(verificationDocumentType)
    : false;
  const rawAddressVerificationDocumentType = body.addressVerificationDocumentType;
  // Only stored when actually required — never trust/store a client-sent
  // value for a document type that doesn't need it.
  const addressVerificationDocumentType =
    documentRequiresAddressProof && isAddressVerificationDocumentType(rawAddressVerificationDocumentType)
      ? rawAddressVerificationDocumentType
      : null;
  const addressVerificationDocumentPath = documentRequiresAddressProof
    ? asString(body.addressVerificationDocumentPath) || null
    : null;

  if (!abn) return { success: false, error: "Please enter your ABN." };
  if (!businessAddress) return { success: false, error: "Please enter your business address." };
  if (!notificationMobile) {
    return { success: false, error: "Please enter a preferred notification mobile." };
  }
  if (!suburbsCovered) return { success: false, error: "Please enter your service suburbs/area." };
  if (!openingHours) return { success: false, error: "Please enter your business opening hours." };
  if (useExistingNumber === null) {
    return { success: false, error: "Please let us know whether to forward your existing number." };
  }
  // Never required: populated automatically via the Google Business Profile
  // lookup when the customer confirms a match, but a failed/skipped/
  // ambiguous lookup must never block setup completion. If present, still
  // defensively checked — this endpoint doesn't trust any client-sent value
  // blindly.
  if (googleLink && !isValidHttpUrl(googleLink)) {
    return { success: false, error: "Please enter a valid Google Business Profile / review link." };
  }

  // ── Business verification (mandatory: required to provision the phone
  // number, never made optional for friction's sake) ────────────────────
  if (!verificationDocumentType) {
    return { success: false, error: "Please select a verification document type." };
  }
  if (!verificationDocumentPath) {
    return { success: false, error: "Please upload your verification document." };
  }
  if (verificationDocumentType === "other" && !verificationDocumentOtherDescription) {
    return { success: false, error: "Please specify the document type." };
  }
  if (documentRequiresAddressProof) {
    if (!addressVerificationDocumentType) {
      return { success: false, error: "Please select a proof-of-address document type." };
    }
    if (!addressVerificationDocumentPath) {
      return { success: false, error: "Please upload your proof-of-address document." };
    }
  }

  const tooLong =
    abn.length > MAX_LENGTHS.abn ||
    businessAddress.length > MAX_LENGTHS.businessAddress ||
    (tradingName?.length ?? 0) > MAX_LENGTHS.tradingName ||
    (existingWebsite?.length ?? 0) > MAX_LENGTHS.existingWebsite ||
    notificationMobile.length > MAX_LENGTHS.notificationMobile ||
    suburbsCovered.length > MAX_LENGTHS.suburbsCovered ||
    openingHours.length > MAX_LENGTHS.openingHours ||
    (numberPortingNotes?.length ?? 0) > MAX_LENGTHS.numberPortingNotes ||
    (googleLink?.length ?? 0) > MAX_LENGTHS.googleLink ||
    (notes?.length ?? 0) > MAX_LENGTHS.notes ||
    (referralSource?.length ?? 0) > MAX_LENGTHS.referralSource ||
    (websiteNotes?.length ?? 0) > MAX_LENGTHS.websiteNotes ||
    (verificationDocumentOtherDescription?.length ?? 0) > MAX_LENGTHS.verificationDocumentOtherDescription;

  if (tooLong) {
    return { success: false, error: "One of the fields is too long. Please shorten it and try again." };
  }

  return {
    success: true,
    fields: {
      abn,
      businessAddress,
      tradingName,
      existingWebsite,
      notificationMobile,
      suburbsCovered,
      openingHours,
      useExistingNumber,
      numberPortingNotes,
      services,
      colourScheme,
      googleLink,
      notes,
      referralSource,
      logoPath,
      websitePhotoPaths,
      websiteNotes,
      verificationDocumentType,
      verificationDocumentPath,
      verificationDocumentOtherDescription,
      addressVerificationDocumentType,
      addressVerificationDocumentPath,
    },
  };
}
