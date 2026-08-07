import type { ChangeEvent } from "react";
import type { VerificationDocumentType } from "@/lib/onboarding/verificationDocuments";
import type { AddressVerificationDocumentType } from "@/lib/onboarding/verificationDocuments";

export type OnboardingFormData = {
  // ── Step 1: Verify Your Business ───────────────────────────────────────
  businessName: string;
  abn: string;
  businessAddress: string;
  tradingName: string;
  existingWebsite: string;
  verificationDocumentType: VerificationDocumentType | null;
  verificationDocumentPath: string | null;
  verificationDocumentFileName: string | null;
  verificationDocumentOtherDescription: string;
  addressVerificationDocumentType: AddressVerificationDocumentType | null;
  addressVerificationDocumentPath: string | null;
  addressVerificationDocumentFileName: string | null;

  // ── Step 2: Contact & Notifications ────────────────────────────────────
  ownerName: string;
  businessPhone: string;
  businessEmail: string;
  notificationMobile: string;

  // ── Step 3: Teach Your AI ───────────────────────────────────────────────
  services: string[];
  suburbsCovered: string;
  openingHours: string;
  offersEmergencyService: boolean | null;
  bookingMethod: string;
  aiOffersBookingTimes: boolean | null;
  bookingDestination: string;
  urgentJobHandling: string;
  useExistingNumber: boolean | null;
  numberPortingNotes: string;
  googleLink: string;
  notes: string;

  // ── Step 4 (Complete only): Website Setup ──────────────────────────────
  colourScheme: string;
  logoPath: string | null;
  logoFileName: string | null;
  websitePhotoPaths: { path: string; fileName: string }[];
  websiteNotes: string;

  // ── Final step: Review & Activate ──────────────────────────────────────
  referralSource: string;
};

export type UpdateField = (
  field: keyof OnboardingFormData,
) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
