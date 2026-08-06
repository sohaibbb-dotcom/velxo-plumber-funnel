import "server-only";
import { NextResponse, after } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { findColorScheme } from "@/lib/colorSchemes";
import { generateServices } from "@/lib/preview/content";
import { callSiteGenerator } from "@/lib/preview/generator";
import { pushPreviewLeadToHighLevel } from "@/lib/leadFulfillment";
import type { PreviewRequestRow } from "@/lib/preview/types";

const MAX_LENGTHS = {
  businessName: 200,
  contactName: 200,
  email: 254,
  phone: 32,
  suburb: 200,
  primaryService: 200,
  website: 300,
  attributionValue: 255,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_VALIDATION_ERROR = "Please check the required fields and try again.";
const GENERIC_SERVER_ERROR = "We couldn't save your request. Please try again.";

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

type RequestBody = {
  businessName?: unknown;
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  suburb?: unknown;
  primaryService?: unknown;
  website?: unknown;
  colorScheme?: unknown;
  honeypot?: unknown;
  attribution?: unknown;
};

/** DB-column-named, post-sanitization. Every field independently optional — attribution is best-effort. */
type CleanAttribution = {
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

type CleanInput = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  suburb: string;
  primaryService: string;
  website: string | null;
  primaryColor: string;
  secondaryColor: string;
  attribution: CleanAttribution;
};

type ValidationResult =
  | { ok: true; data: CleanInput }
  | { ok: false; error: string };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Strips characters that could inject markup. Applied to every free-text
 * field before it's stored or forwarded to the generator API — the
 * generator's own templating isn't this project's code, so this is defense
 * in depth against it interpolating a field unescaped.
 */
function stripHtml(value: string): string {
  return value.replace(/[<>]/g, "");
}

/**
 * Best-effort: a missing or malformed attribution object never fails the
 * submission, it just means this lead won't be traceable back to an ad.
 * Each value is trimmed, HTML-stripped, and length-capped like every other
 * free-text field this route already sanitizes.
 */
function sanitizeAttribution(raw: unknown): CleanAttribution {
  const input = raw && typeof raw === "object" ? (raw as AttributionInput) : {};

  const clean = (value: unknown): string | null => {
    const stripped = stripHtml(asString(value)).slice(0, MAX_LENGTHS.attributionValue);
    return stripped.length > 0 ? stripped : null;
  };

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

function validate(body: RequestBody): ValidationResult {
  // Honeypot: real visitors never see or fill this field. Any bot that
  // auto-fills every input will populate it, so treat non-empty as spam
  // without revealing that a honeypot exists.
  if (asString(body.honeypot).length > 0) {
    return { ok: false, error: GENERIC_VALIDATION_ERROR };
  }

  const businessName = stripHtml(asString(body.businessName));
  const contactName = stripHtml(asString(body.contactName));
  const suburb = stripHtml(asString(body.suburb));
  const phone = asString(body.phone);
  const emailRaw = asString(body.email);
  const email = emailRaw.toLowerCase();
  const primaryService = stripHtml(asString(body.primaryService));
  const websiteRaw = stripHtml(asString(body.website));
  const website = websiteRaw.length > 0 ? websiteRaw : null;

  // Any unrecognised or missing value safely falls back to the default
  // scheme (Dark Navy + Electric Blue) rather than failing the submission —
  // colour choice isn't validation-critical the way an email address is.
  const { primaryColor, secondaryColor } = findColorScheme(asString(body.colorScheme));

  if (!businessName) {
    return { ok: false, error: "Please enter your business name." };
  }
  if (!contactName) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!suburb) {
    return { ok: false, error: "Please enter your suburb." };
  }
  if (!phone) {
    return { ok: false, error: "Please enter your phone number." };
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!primaryService) {
    return { ok: false, error: "Please select a primary service." };
  }

  const tooLong =
    businessName.length > MAX_LENGTHS.businessName ||
    contactName.length > MAX_LENGTHS.contactName ||
    email.length > MAX_LENGTHS.email ||
    phone.length > MAX_LENGTHS.phone ||
    suburb.length > MAX_LENGTHS.suburb ||
    primaryService.length > MAX_LENGTHS.primaryService ||
    (website !== null && website.length > MAX_LENGTHS.website);

  if (tooLong) {
    return {
      ok: false,
      error: "One of the fields is too long. Please shorten it and try again.",
    };
  }

  return {
    ok: true,
    data: {
      businessName,
      contactName,
      email,
      phone,
      suburb,
      primaryService,
      website,
      primaryColor,
      secondaryColor,
      attribution: sanitizeAttribution(body.attribution),
    },
  };
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: GENERIC_VALIDATION_ERROR },
      { status: 400 },
    );
  }

  const validation = validate(body);
  if (!validation.ok) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  const {
    businessName,
    contactName,
    email,
    phone,
    suburb,
    primaryService,
    website,
    primaryColor,
    secondaryColor,
    attribution,
  } = validation.data;

  const { data: inserted, error: insertError } = await supabaseServer
    .from("preview_requests")
    .insert({
      business_name: businessName,
      contact_name: contactName,
      email,
      phone,
      suburb,
      primary_service: primaryService,
      website,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      source: "preview_form",
      meta_ad_id: attribution.metaAdId,
      meta_adset_id: attribution.metaAdsetId,
      meta_campaign_id: attribution.metaCampaignId,
      meta_creative_id: attribution.metaCreativeId,
      fbclid: attribution.fbclid,
      utm_source: attribution.utmSource,
      utm_medium: attribution.utmMedium,
      utm_campaign: attribution.utmCampaign,
      utm_content: attribution.utmContent,
      utm_term: attribution.utmTerm,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    console.error("preview_requests insert failed:", insertError?.message);
    return NextResponse.json(
      { success: false, error: GENERIC_SERVER_ERROR },
      { status: 500 },
    );
  }

  // Pushed to HighLevel after the response is sent — a slow or down GHL
  // must never delay or fail the customer-facing preview submission.
  after(() => pushPreviewLeadToHighLevel(inserted as PreviewRequestRow));

  const publicId = inserted.public_id;
  const previewUrl = `/p/${publicId}`;

  // The generator wants a plain title list, not the {title, description}
  // shape this app renders its own (now-fallback-only) template with.
  const services = generateServices(primaryService, null).map((s) => s.title);

  const generated = await callSiteGenerator({
    businessName,
    phone,
    suburb,
    primaryService,
    services,
    primaryColor,
    secondaryColor,
    website,
    publicId,
  });

  if (!generated.ok) {
    console.error("Site generator call failed:", generated.error);
    // The lead is already saved — only the generation attempt failed.
    // Best-effort status update; if this write itself fails (e.g. a schema
    // hiccup), the lead is still safe and the row just stays at "pending".
    await supabaseServer
      .from("preview_requests")
      .update({ status: "failed", preview_url: previewUrl })
      .eq("public_id", publicId)
      .then(({ error }) => {
        if (error) console.error("Failed to mark preview_requests row as failed:", error.message);
      });

    return NextResponse.json(
      {
        success: false,
        error: "We saved your details, but couldn't build your preview automatically. Please try again.",
        retryable: true,
      },
      { status: 502 },
    );
  }

  const { error: updateError } = await supabaseServer
    .from("preview_requests")
    .update({
      generated_html: generated.html,
      status: "generated",
      preview_url: previewUrl,
    })
    .eq("public_id", publicId);

  if (updateError) {
    // Most likely cause: the generated_html migration hasn't been applied
    // yet. The lead is saved and the generated HTML did come back
    // successfully — it just couldn't be persisted, so the preview page
    // will fall back to its pending-state view until the column exists.
    console.error("Failed to store generated_html:", updateError.message);
  }

  return NextResponse.json({
    success: true,
    publicId,
    previewUrl,
  });
}
