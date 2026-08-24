import { trackMetaPixelCustomEvent } from "@/lib/metaPixel";
import { getStoredAttribution } from "@/lib/attribution";

/**
 * Diagnostic conversion-funnel events (see CLAUDE.md's funnel-instrumentation
 * section). Deliberately NOT Meta standard events — sent to Meta only as
 * custom events (trackMetaPixelCustomEvent), and always also persisted
 * first-party via /api/track. TrialStarted is intentionally absent here: it
 * fires server-side only, from the Stripe webhook's own authoritative state
 * (src/lib/subscriptionFulfillment.ts), never from a browser event.
 */
export type FunnelEventName =
  | "PrimaryCTAClick"
  | "OnboardingView"
  | "OnboardingStart"
  | "OnboardingComplete"
  | "CheckoutCreated";

const VISITOR_ID_KEY = "velxo_vid";

/**
 * A first-party, anonymous, per-browser id — purely for correlating this
 * visitor's own funnel events with each other (e.g. "did the browser that
 * clicked the CTA also reach OnboardingComplete"). Not attribution, not a
 * cross-site identifier: same-origin localStorage only, generated once.
 */
function getOrCreateVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_ID_KEY, fresh);
    return fresh;
  } catch {
    // Storage unavailable (private browsing, quota) — the event still fires,
    // it just won't carry a stable visitor id.
    return null;
  }
}

type TrackFunnelEventProps = {
  plan?: string;
  location?: string;
  destination?: string;
  previewPublicId?: string;
  onboardingSubmissionId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Fire-and-forget diagnostic event. Never throws, never awaited by the
 * caller, never delays navigation or blocks the customer — analytics failure
 * must not affect the funnel. Uses navigator.sendBeacon so the event still
 * has a chance to land even when this call is immediately followed by a full
 * page navigation (every primary CTA is a plain <a href>, and Checkout
 * Session creation is immediately followed by window.location.href to
 * Stripe) — a plain fetch() can be aborted by the browser mid-flight in that
 * situation, sendBeacon is specifically designed to survive it.
 */
export function trackFunnelEvent(event: FunnelEventName, props: TrackFunnelEventProps = {}): void {
  if (typeof window === "undefined") return;

  try {
    trackMetaPixelCustomEvent(event, {
      plan: props.plan,
      location: props.location,
    });
  } catch {
    // fail open — Meta Pixel issues must never affect the funnel.
  }

  try {
    const payload = {
      event,
      visitorId: getOrCreateVisitorId(),
      plan: props.plan ?? null,
      location: props.location ?? null,
      destination: props.destination ?? null,
      pathname: window.location.pathname,
      previewPublicId: props.previewPublicId ?? null,
      onboardingSubmissionId: props.onboardingSubmissionId ?? null,
      attribution: getStoredAttribution(),
      metadata: props.metadata ?? {},
    };
    const body = JSON.stringify(payload);
    const url = "/api/track";

    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // fail open
      });
    }
  } catch {
    // fail open — never let a tracking failure surface to the caller.
  }
}
