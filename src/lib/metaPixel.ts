export const META_PIXEL_ID = "1814954343193612";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Fires a Meta Pixel *standard* event (PageView, Lead, ...) if the pixel has loaded. No-ops on the server. */
export function trackMetaPixelEvent(eventName: string) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", eventName);
  }
}

/**
 * Fires a Meta Pixel CUSTOM event (fbq('trackCustom', ...)) — deliberately
 * distinct from trackMetaPixelEvent's standard events. Used for internal
 * diagnostic funnel events (PrimaryCTAClick, OnboardingView, OnboardingStart,
 * OnboardingComplete, CheckoutCreated) so they're never interpreted as one of
 * Meta's own standard conversion events (Lead, CompleteRegistration,
 * InitiateCheckout, ...) or silently wired into campaign optimization built
 * on that semantics. No-ops on the server.
 */
export function trackMetaPixelCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, params);
  }
}
