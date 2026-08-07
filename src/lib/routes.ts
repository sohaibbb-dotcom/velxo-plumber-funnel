/**
 * Single source of truth for the "personalised preview" destination.
 * Every CTA that promises a preview (Navbar, Hero, Showcase, Pricing, ...)
 * must point here, so they can't drift apart into different flows.
 */
export const PREVIEW_FORM_PATH = "/preview";

/**
 * The AI Receptionist 30-day trial destination — the in-app /onboarding
 * wizard (src/app/onboarding), not the legacy onboarding.html project.
 * Every CTA that promises the free trial must point here so they move
 * together.
 */
export const TRIAL_CTA_HREF = "/onboarding?plan=ai_receptionist";

/**
 * The real onboarding flow lives in a separate project (VELXO DIGITAL),
 * not in this app — there is no /onboarding route here. Confirmed live at
 * this exact path (note the required .html — the extensionless /onboarding
 * 404s on that deployment).
 */
const ONBOARDING_BASE_URL = "https://velxo-digital.vercel.app/onboarding.html";

/**
 * Builds the onboarding URL for a given preview. `source=meta` is read by
 * onboarding.html itself — kept for traffic-source tracking even though
 * Velxo now has a single package, so it no longer changes what's shown.
 * `preview` carries the public_id through so the session started there
 * can be traced back to this preview.
 */
export function buildOnboardingUrl(publicId: string): string {
  const url = new URL(ONBOARDING_BASE_URL);
  url.searchParams.set("source", "meta");
  url.searchParams.set("preview", publicId);
  return url.toString();
}
