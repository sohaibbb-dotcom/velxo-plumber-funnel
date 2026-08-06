import type { Plan } from "@/lib/plans";

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
  created_at: string;
  updated_at: string;
};
