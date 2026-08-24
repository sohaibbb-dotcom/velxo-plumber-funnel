import "server-only";

/**
 * Shared server-side attribution sanitization — extracted from
 * src/app/api/preview-requests/route.ts so every route that persists
 * client-supplied attribution (preview-requests, onboarding-submissions,
 * track) applies the exact same whitelist and cleaning rules instead of
 * re-implementing it. Best-effort throughout: a missing or malformed
 * attribution object never fails the caller, it just means the record won't
 * be traceable back to an ad.
 */

const MAX_ATTRIBUTION_VALUE_LENGTH = 255;

/** Mirrors the client-side shape from src/lib/attribution.ts — Meta's raw query param names. */
type AttributionInput = {
  ad_id?: unknown;
  adset_id?: unknown;
  campaign_id?: unknown;
  creative_id?: unknown;
  fbclid?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
};

/** DB-column-named, post-sanitization. Every field independently optional. */
export type CleanAttribution = {
  metaAdId: string | null;
  metaAdsetId: string | null;
  metaCampaignId: string | null;
  metaCreativeId: string | null;
  fbclid: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Strips characters that could inject markup, same as every other free-text field these routes sanitize. */
function stripHtml(value: string): string {
  return value.replace(/[<>]/g, "");
}

function clean(value: unknown): string | null {
  const stripped = stripHtml(asString(value)).slice(0, MAX_ATTRIBUTION_VALUE_LENGTH);
  return stripped.length > 0 ? stripped : null;
}

export function sanitizeAttribution(raw: unknown): CleanAttribution {
  const input = raw && typeof raw === "object" ? (raw as AttributionInput) : {};

  return {
    metaAdId: clean(input.ad_id),
    metaAdsetId: clean(input.adset_id),
    metaCampaignId: clean(input.campaign_id),
    metaCreativeId: clean(input.creative_id),
    fbclid: clean(input.fbclid),
    utmSource: clean(input.utm_source),
    utmMedium: clean(input.utm_medium),
    utmCampaign: clean(input.utm_campaign),
    utmContent: clean(input.utm_content),
    utmTerm: clean(input.utm_term),
  };
}

/**
 * Same whitelist/sanitization as sanitizeAttribution, returned as a
 * snake_case object for jsonb storage (funnel_events.attribution) rather
 * than mapped to individual typed DB columns.
 */
export function sanitizeAttributionToJson(raw: unknown): Record<string, string> {
  const c = sanitizeAttribution(raw);
  const out: Record<string, string> = {};
  if (c.metaAdId) out.ad_id = c.metaAdId;
  if (c.metaAdsetId) out.adset_id = c.metaAdsetId;
  if (c.metaCampaignId) out.campaign_id = c.metaCampaignId;
  if (c.metaCreativeId) out.creative_id = c.metaCreativeId;
  if (c.fbclid) out.fbclid = c.fbclid;
  if (c.utmSource) out.utm_source = c.utmSource;
  if (c.utmMedium) out.utm_medium = c.utmMedium;
  if (c.utmCampaign) out.utm_campaign = c.utmCampaign;
  if (c.utmContent) out.utm_content = c.utmContent;
  if (c.utmTerm) out.utm_term = c.utmTerm;
  return out;
}
