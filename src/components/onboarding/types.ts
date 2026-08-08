import type { ChangeEvent } from "react";
import type { VerificationDocumentType } from "@/lib/onboarding/verificationDocuments";
import type { AddressVerificationDocumentType } from "@/lib/onboarding/verificationDocuments";
import type { GooglePlaceCandidate } from "@/lib/google/types";

export type HoursMode = "standard" | "custom" | "247";

/**
 * Client-side-only state for the automatic Google Business Profile lookup
 * (GoogleBusinessProfileConnect) — never sent to the server as its own
 * field. Only the resulting `googleLink` (and nothing else here) is part of
 * the onboarding-submissions payload.
 */
export type GoogleReviewLinkStatus =
  | "idle"
  | "searching"
  | "results"
  | "confirmed"
  | "not_found"
  | "error"
  | "skipped";

export type CustomHoursDay = {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  closed: boolean;
  open: string;
  close: string;
};

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

  // ── Step 3: Help Us Personalise Your AI Receptionist ───────────────────
  services: string[];
  suburbsCovered: string;
  // openingHours is the composed, human-readable string actually sent to
  // the server — hoursMode/standardOpenTime/standardCloseTime/customHours
  // are UI-only state that BusinessHoursPicker keeps it in sync with.
  openingHours: string;
  hoursMode: HoursMode;
  standardOpenTime: string;
  standardCloseTime: string;
  customHours: CustomHoursDay[];
  useExistingNumber: boolean | null;
  numberPortingNotes: string;
  // Populated automatically once the user confirms a Google Business Profile
  // match (see GoogleBusinessProfileConnect) — this is still the one field
  // actually submitted to the server; the rest below are UI-only.
  googleLink: string;
  googlePlaceId: string | null;
  googleReviewStatus: GoogleReviewLinkStatus;
  googleCandidates: GooglePlaceCandidate[];
  googleSearchQuery: string;
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
