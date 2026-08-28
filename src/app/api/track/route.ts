import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sanitizeAttributionToJson } from "@/lib/attributionSanitize";

/**
 * First-party sink for src/lib/analytics/events.ts's trackFunnelEvent().
 * Same-origin only — called via navigator.sendBeacon()/fetch from this
 * app's own pages, never cross-origin. Deliberately narrow: an allowlisted
 * event_name, short whitelisted string fields, and the same attribution
 * sanitizer every other route uses. Always responds 204 quickly — this must
 * never become a slow or failing dependency for the customer-facing funnel
 * it's only observing.
 */

const ALLOWED_EVENTS = new Set([
  "PrimaryCTAClick",
  "OnboardingView",
  "CalculatorStart",
  "CalculatorComplete",
  "ResultViewed",
  "DetailsStart",
  "OnboardingComplete",
  "CheckoutCreated",
]);

const MAX_FIELD_LENGTH = 255;
const NO_CONTENT = new NextResponse(null, { status: 204 });

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, MAX_FIELD_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

/** Best-effort, bounded metadata passthrough — never trusted for anything business-critical. */
function asMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);
  const out: Record<string, unknown> = {};
  for (const [key, val] of entries) {
    if (typeof key !== "string" || key.length > 64) continue;
    if (typeof val === "string") out[key] = val.slice(0, MAX_FIELD_LENGTH);
    else if (typeof val === "number" || typeof val === "boolean" || val === null) out[key] = val;
  }
  return out;
}

/**
 * trackFunnelEvent (src/lib/analytics/events.ts) only ever knows an
 * onboarding_submissions row by its PUBLIC id (the same public_id the client
 * already holds from /api/onboarding-submissions's response) — never the
 * internal uuid, which is never sent to the browser. funnel_events.
 * onboarding_submission_id is a uuid FK to onboarding_submissions.id, so it
 * must be resolved server-side first. Best-effort: an unresolvable id must
 * not fail the whole event write, it just means this row won't carry the FK.
 */
async function resolveOnboardingSubmissionUuid(publicId: string | null): Promise<string | null> {
  if (!publicId) return null;
  const { data, error } = await supabaseServer
    .from("onboarding_submissions")
    .select("id")
    .eq("public_id", publicId)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NO_CONTENT;
  }

  const eventName = typeof body.event === "string" ? body.event : "";
  if (!ALLOWED_EVENTS.has(eventName)) {
    return NO_CONTENT;
  }

  const onboardingSubmissionUuid = await resolveOnboardingSubmissionUuid(asString(body.onboardingSubmissionId));

  const { error } = await supabaseServer.from("funnel_events").insert({
    event_name: eventName,
    visitor_id: asString(body.visitorId),
    plan: asString(body.plan),
    location: asString(body.location),
    pathname: asString(body.pathname),
    preview_public_id: asString(body.previewPublicId),
    onboarding_submission_id: onboardingSubmissionUuid,
    attribution: sanitizeAttributionToJson(body.attribution),
    metadata: asMetadata(body.metadata),
  });

  if (error) {
    // Best-effort only — never surface this to the client, never retry.
    console.error(`funnel_events insert failed for event "${eventName}":`, error.message);
  }

  return NO_CONTENT;
}
