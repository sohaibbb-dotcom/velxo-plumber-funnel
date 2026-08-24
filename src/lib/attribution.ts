/**
 * Client-side capture of Meta ad attribution, persisted so it survives a
 * refresh or browsing around before a form is submitted.
 * captureAttributionFromUrl() is called from every page via
 * src/components/analytics/AttributionCapture.tsx (mounted in the root
 * layout) — not just /preview — since the AI Receptionist funnel's entry
 * point is the homepage, not /preview. This is the ONLY mechanism
 * attribution is ever read from a URL — everything downstream (onboarding,
 * Stripe) traces back via a row's own id, never by expecting these values to
 * still be present later.
 *
 * Storage is same-origin localStorage, which cannot and does not need to
 * survive the hop to onboarding.html (a different domain) — that hop is
 * carried by the `preview` id already appended to the onboarding link,
 * looked up server-side instead.
 */

const STORAGE_KEY = "velxo_attribution_v1";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const ATTRIBUTION_PARAMS = [
  "ad_id",
  "adset_id",
  "campaign_id",
  "creative_id",
  "fbclid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type AttributionParam = (typeof ATTRIBUTION_PARAMS)[number];

export type AttributionData = Partial<Record<AttributionParam, string>>;

type StoredAttribution = {
  data: AttributionData;
  capturedAt: number;
};

/**
 * Reads tracked params from the current URL. If any are present, this is
 * treated as a fresh attributed visit and REPLACES whatever was stored
 * before. If none are present (e.g. a page refresh, or an internal link
 * with no ad params), the existing stored value is left untouched rather
 * than being cleared.
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const found: AttributionData = {};

  for (const key of ATTRIBUTION_PARAMS) {
    const value = params.get(key);
    if (value) found[key] = value;
  }

  if (Object.keys(found).length === 0) return;

  const stored: StoredAttribution = { data: found, capturedAt: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage unavailable (private browsing, quota) — attribution is
    // best-effort, never block the funnel over it.
  }
}

/** Returns the stored attribution, or {} if none / expired. */
export function getStoredAttribution(): AttributionData {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const stored = JSON.parse(raw) as StoredAttribution;
    if (Date.now() - stored.capturedAt > MAX_AGE_MS) return {};

    return stored.data ?? {};
  } catch {
    return {};
  }
}
