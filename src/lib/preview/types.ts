/** Raw shape of a public.preview_requests row, as returned by Supabase. */
export type PreviewRequestRow = {
  id: string;
  public_id: string;
  business_name: string;
  contact_name: string | null;
  email: string;
  phone: string;
  suburb: string;
  primary_service: string;
  website: string | null;
  generated_headline: string | null;
  generated_subheadline: string | null;
  generated_services: string[] | null;
  generated_html: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  preview_url: string | null;
  status: string;
  source: string;
  created_at: string;
  preview_viewed_at: string | null;
  onboarding_started_at: string | null;
  updated_at: string;
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
  meta_ad_id: string | null;
  meta_adset_id: string | null;
  meta_campaign_id: string | null;
  meta_creative_id: string | null;
  fbclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

/** Hero headline split into the parts the ported template needs to style. */
export type HeadlineParts = {
  prefix: string;
  /** Rendered in the accent colour. Null when the whole headline is custom text. */
  accent: string | null;
  suffix: string;
};

/** Hero subheadline with an optional bolded phrase, mirroring the source template. */
export type SubheadlineParts = {
  before: string;
  bold: string | null;
  after: string;
};

/** A single service card: title plus a distinct, specific short description. */
export type ServiceItem = {
  title: string;
  description: string;
};

/** Fully-resolved data ready to hand to the preview-template components. */
export type PreviewData = {
  publicId: string;
  businessName: string;
  phone: string;
  suburb: string;
  primaryService: string;
  website: string | null;
  headline: HeadlineParts;
  subheadline: SubheadlineParts;
  services: ServiceItem[];
  primaryColor: string;
  secondaryColor: string;
};
