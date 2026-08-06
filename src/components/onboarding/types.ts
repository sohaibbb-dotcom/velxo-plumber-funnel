import type { ChangeEvent } from "react";

export type OnboardingFormData = {
  businessName: string;
  abn: string;
  businessAddress: string;
  ownerName: string;
  businessPhone: string;
  businessEmail: string;
  services: string[];
  suburbsCovered: string;
  colourScheme: string;
  googleLink: string;
  notes: string;
  referralSource: string;
};

export type UpdateField = (
  field: keyof OnboardingFormData,
) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
