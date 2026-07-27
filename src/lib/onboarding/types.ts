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
  status: string;
  stripe_session_id: string | null;
  stripe_customer_id: string | null;
  payment_status: string | null;
  deposit_paid_at: string | null;
  webhook_event_id: string | null;
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
};
