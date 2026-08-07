/**
 * Single source of truth for the "personalised preview" destination.
 * Every CTA that promises a preview (Navbar, Hero, Showcase, Pricing, ...)
 * must point here, so they can't drift apart into different flows.
 */
export const PREVIEW_FORM_PATH = "/preview";

/**
 * The AI Receptionist 30-day trial destination — the in-app /onboarding
 * wizard (src/app/onboarding). Every CTA that promises the free trial must
 * point here so they move together.
 */
export const TRIAL_CTA_HREF = "/onboarding?plan=ai_receptionist";

/**
 * The Velxo Complete 30-day trial destination — same in-app /onboarding
 * wizard, different plan. Replaces the old hand-off to the external
 * VELXO DIGITAL onboarding.html project and its $500 deposit Payment Link,
 * which this repo no longer links to anywhere.
 */
export const COMPLETE_TRIAL_CTA_HREF = "/onboarding?plan=complete";

/**
 * Builds the in-app onboarding URL for a given preview, so the Complete-plan
 * CTA shown on a generated preview page (src/app/p/[publicId]/route.ts)
 * carries the preview's public_id through to onboarding — looked up
 * server-side in /api/onboarding-submissions to link the two rows, the same
 * pattern the rest of this app uses for attribution (never re-reading URL
 * params downstream, only ever an id lookup).
 */
export function buildOnboardingUrl(publicId: string): string {
  return `${COMPLETE_TRIAL_CTA_HREF}&preview=${encodeURIComponent(publicId)}`;
}
