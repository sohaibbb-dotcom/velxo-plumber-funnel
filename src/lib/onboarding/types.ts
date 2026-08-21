import type { Plan } from "@/lib/plans";
import type {
  VerificationDocumentType,
  AddressVerificationDocumentType,
} from "@/lib/onboarding/verificationDocuments";

/** Raw shape of a public.onboarding_submissions row, as returned by Supabase. */
export type OnboardingSubmissionRow = {
  id: string;
  public_id: string;
  business_name: string;
  abn: string | null;
  business_address: string | null;
  business_phone: string;
  business_email: string;
  owner_name: string;
  services: string[];
  suburbs_covered: string | null;
  colour_scheme: string | null;
  google_link: string | null;
  notes: string | null;
  referral_source: string | null;
  status: string;
  stripe_session_id: string | null;
  stripe_customer_id: string | null;
  payment_status: string | null;
  deposit_paid_at: string | null;
  webhook_event_id: string | null;
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
  preview_request_id: string | null;
  // ── Subscription flow (Phase 1 of the AI Receptionist-first pivot) ────
  // Nullable: unused until Phase 2's webhook writes to them, and legacy
  // deposit-flow rows never populate them at all.
  plan: Plan | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  subscription_status: string | null;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  payment_method_status: string | null;
  // ── Onboarding activation redesign (Phase 4) ───────────────────────────
  // All nullable: legacy onboarding.html submissions never send these, and
  // several are only ever populated depending on plan/document type.
  trading_name: string | null;
  existing_website: string | null;
  notification_mobile: string | null;
  opening_hours: string | null;
  offers_emergency_service: boolean | null;
  booking_method: string | null;
  ai_offers_booking_times: boolean | null;
  booking_destination: string | null;
  urgent_job_handling: string | null;
  use_existing_number: boolean | null;
  number_porting_notes: string | null;
  logo_path: string | null;
  website_photo_paths: string[];
  website_notes: string | null;
  verification_document_type: VerificationDocumentType | null;
  verification_document_path: string | null;
  verification_document_other_description: string | null;
  address_verification_document_type: AddressVerificationDocumentType | null;
  address_verification_document_path: string | null;
  // ── Two-phase onboarding / provisioning-safety gate ────────────────────
  // Both nullable: unset until the Finish Setup step (setup_completed_at)
  // and the provisioning trigger (provisioning_triggered_at) actually fire —
  // see src/lib/onboarding/provisioning.ts.
  setup_completed_at: string | null;
  provisioning_triggered_at: string | null;
  created_at: string;
  updated_at: string;
};
