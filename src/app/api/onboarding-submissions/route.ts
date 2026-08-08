import "server-only";
import { NextResponse, after } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { reuseForOnboarding } from "@/lib/leadFulfillment";
import { isPlan } from "@/lib/plans";
import {
  isVerificationDocumentType,
  isAddressVerificationDocumentType,
  requiresAddressProof,
} from "@/lib/onboarding/verificationDocuments";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";

/**
 * onboarding.html is a static site with no backend of its own (hosted as
 * VELXO DIGITAL, separate Vercel project) — this is the only place its
 * wizard data can be persisted before the customer is sent to Stripe. Called
 * cross-origin, so this route needs its own CORS handling.
 */
const ALLOWED_ORIGINS = new Set([
  "https://www.velxodigital.com",
  "https://velxodigital.com",
  "https://velxo-digital.vercel.app",
  "http://localhost:3000",
]);

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

const MAX_LENGTHS = {
  businessName: 200,
  abn: 32,
  businessAddress: 300,
  businessPhone: 32,
  businessEmail: 254,
  ownerName: 200,
  suburbsCovered: 1000,
  googleLink: 500,
  notes: 2000,
  referralSource: 200,
  tradingName: 200,
  existingWebsite: 500,
  notificationMobile: 32,
  openingHours: 500,
  numberPortingNotes: 1000,
  websiteNotes: 2000,
  verificationDocumentOtherDescription: 200,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "Please check the required fields and try again.";

type RequestBody = {
  businessName?: unknown;
  abn?: unknown;
  businessAddress?: unknown;
  businessPhone?: unknown;
  businessEmail?: unknown;
  ownerName?: unknown;
  services?: unknown;
  suburbsCovered?: unknown;
  colourScheme?: unknown;
  googleLink?: unknown;
  notes?: unknown;
  previewPublicId?: unknown;
  referralSource?: unknown;
  /**
   * Which subscription product this submission is for — set by the new
   * in-app /onboarding wizard. Optional and unvalidated-if-absent for
   * backward compatibility: legacy onboarding.html doesn't send it yet.
   */
  plan?: unknown;
  // ── Onboarding activation redesign (Phase 4) — only ever sent by the new
  // in-app wizard (i.e. whenever `plan` is present). Legacy onboarding.html
  // never sends these, so all requirement checks below are gated on `plan`.
  tradingName?: unknown;
  existingWebsite?: unknown;
  notificationMobile?: unknown;
  openingHours?: unknown;
  useExistingNumber?: unknown;
  numberPortingNotes?: unknown;
  logoPath?: unknown;
  websitePhotoPaths?: unknown;
  websiteNotes?: unknown;
  verificationDocumentType?: unknown;
  verificationDocumentPath?: unknown;
  verificationDocumentOtherDescription?: unknown;
  addressVerificationDocumentType?: unknown;
  addressVerificationDocumentPath?: unknown;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripHtml(value: string): string {
  return value.replace(/[<>]/g, "");
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => stripHtml(v.trim()))
    .filter(Boolean)
    .slice(0, 50);
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

/** Google review automation needs a real, resolvable destination — http(s) only. */
function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolves the preview_requests row this submission came from, if any —
 * the Velxo-owned id that carries Meta attribution across the domain hop
 * from onboarding.html. Best-effort: a missing, invalid, or unmatched id
 * never fails the submission, it just leaves this row unattributed (e.g.
 * someone reached onboarding directly, without going through /preview).
 */
async function findPreviewRequestId(rawPreviewPublicId: unknown): Promise<string | null> {
  const publicId = asString(rawPreviewPublicId);
  if (!publicId) return null;

  const { data, error } = await supabaseServer
    .from("preview_requests")
    .select("id")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) {
    console.error("Failed to look up preview_requests for attribution:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400, headers });
  }

  // Optional: absent entirely for legacy onboarding.html submissions. If
  // present, it must be one of the canonical values — never silently
  // dropped, since a caller that explicitly sent a plan expects it stored.
  if (body.plan !== undefined && !isPlan(body.plan)) {
    return NextResponse.json(
      { success: false, error: "Invalid plan selected." },
      { status: 400, headers },
    );
  }
  const plan = isPlan(body.plan) ? body.plan : null;
  // Everything below this point that's gated on `isNewWizard` only ever
  // applies to submissions from the new in-app /onboarding wizard — legacy
  // onboarding.html submissions (plan === null) keep the original,
  // pre-Phase-4 required-field set so that flow is never broken.
  const isNewWizard = plan !== null;

  const businessName = stripHtml(asString(body.businessName));
  const abn = stripHtml(asString(body.abn)) || null;
  const businessAddress = stripHtml(asString(body.businessAddress)) || null;
  const businessPhone = asString(body.businessPhone);
  const businessEmail = asString(body.businessEmail).toLowerCase();
  const ownerName = stripHtml(asString(body.ownerName));
  const services = asStringArray(body.services);
  const suburbsCovered = stripHtml(asString(body.suburbsCovered)) || null;
  const colourScheme = stripHtml(asString(body.colourScheme)) || null;
  const googleLink = asString(body.googleLink) || null;
  const notes = stripHtml(asString(body.notes)) || null;
  const referralSource = stripHtml(asString(body.referralSource)) || null;

  const tradingName = stripHtml(asString(body.tradingName)) || null;
  const existingWebsite = asString(body.existingWebsite) || null;
  const notificationMobile = asString(body.notificationMobile) || null;
  const openingHours = stripHtml(asString(body.openingHours)) || null;
  const useExistingNumber = asBoolean(body.useExistingNumber);
  const numberPortingNotes = stripHtml(asString(body.numberPortingNotes)) || null;
  const logoPath = asString(body.logoPath) || null;
  const websitePhotoPaths = asStringArray(body.websitePhotoPaths);
  const websiteNotes = stripHtml(asString(body.websiteNotes)) || null;

  const rawVerificationDocumentType = body.verificationDocumentType;
  const verificationDocumentType = isVerificationDocumentType(rawVerificationDocumentType)
    ? rawVerificationDocumentType
    : null;
  const verificationDocumentPath = asString(body.verificationDocumentPath) || null;
  // Only ever stored for "other" — forced null for every other type,
  // regardless of what the client sent, per spec.
  const verificationDocumentOtherDescription =
    verificationDocumentType === "other"
      ? stripHtml(asString(body.verificationDocumentOtherDescription)) || null
      : null;

  const documentRequiresAddressProof = verificationDocumentType
    ? requiresAddressProof(verificationDocumentType)
    : false;
  const rawAddressVerificationDocumentType = body.addressVerificationDocumentType;
  // Only stored when actually required — never trust/store a client-sent
  // value for a document type that doesn't need it.
  const addressVerificationDocumentType =
    documentRequiresAddressProof && isAddressVerificationDocumentType(rawAddressVerificationDocumentType)
      ? rawAddressVerificationDocumentType
      : null;
  const addressVerificationDocumentPath = documentRequiresAddressProof
    ? asString(body.addressVerificationDocumentPath) || null
    : null;

  if (!businessName) {
    return NextResponse.json(
      { success: false, error: "Please enter your business name." },
      { status: 400, headers },
    );
  }
  if (!businessPhone) {
    return NextResponse.json(
      { success: false, error: "Please enter your business phone number." },
      { status: 400, headers },
    );
  }
  if (!businessEmail || !EMAIL_REGEX.test(businessEmail)) {
    return NextResponse.json(
      { success: false, error: "Please enter a valid business email address." },
      { status: 400, headers },
    );
  }
  if (!ownerName) {
    return NextResponse.json(
      { success: false, error: "Please enter your name." },
      { status: 400, headers },
    );
  }

  if (isNewWizard) {
    if (!abn) {
      return NextResponse.json({ success: false, error: "Please enter your ABN." }, { status: 400, headers });
    }
    if (!businessAddress) {
      return NextResponse.json(
        { success: false, error: "Please enter your business address." },
        { status: 400, headers },
      );
    }
    if (!notificationMobile) {
      return NextResponse.json(
        { success: false, error: "Please enter a preferred notification mobile." },
        { status: 400, headers },
      );
    }
    if (!suburbsCovered) {
      return NextResponse.json(
        { success: false, error: "Please enter your service suburbs/area." },
        { status: 400, headers },
      );
    }
    if (!openingHours) {
      return NextResponse.json(
        { success: false, error: "Please enter your business opening hours." },
        { status: 400, headers },
      );
    }
    if (useExistingNumber === null) {
      return NextResponse.json(
        { success: false, error: "Please let us know whether to forward your existing number." },
        { status: 400, headers },
      );
    }
    // Required for both plans: the review-request automation needs a real
    // destination to send customers to, or it has nothing to do. Scoped to
    // isNewWizard only — legacy onboarding.html never collects this reliably
    // and keeps its original optional behaviour.
    if (!googleLink) {
      return NextResponse.json(
        { success: false, error: "Please enter your Google Business Profile / review link." },
        { status: 400, headers },
      );
    }
    if (!isValidHttpUrl(googleLink)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid Google Business Profile / review link." },
        { status: 400, headers },
      );
    }

    // ── Business verification (mandatory: required to provision the phone
    // number, never made optional for friction's sake) ────────────────────
    if (!verificationDocumentType) {
      return NextResponse.json(
        { success: false, error: "Please select a verification document type." },
        { status: 400, headers },
      );
    }
    if (!verificationDocumentPath) {
      return NextResponse.json(
        { success: false, error: "Please upload your verification document." },
        { status: 400, headers },
      );
    }
    if (verificationDocumentType === "other" && !verificationDocumentOtherDescription) {
      return NextResponse.json(
        { success: false, error: "Please specify the document type." },
        { status: 400, headers },
      );
    }
    if (documentRequiresAddressProof) {
      if (!addressVerificationDocumentType) {
        return NextResponse.json(
          { success: false, error: "Please select a proof-of-address document type." },
          { status: 400, headers },
        );
      }
      if (!addressVerificationDocumentPath) {
        return NextResponse.json(
          { success: false, error: "Please upload your proof-of-address document." },
          { status: 400, headers },
        );
      }
    }
  }

  const tooLong =
    businessName.length > MAX_LENGTHS.businessName ||
    (abn?.length ?? 0) > MAX_LENGTHS.abn ||
    (businessAddress?.length ?? 0) > MAX_LENGTHS.businessAddress ||
    businessPhone.length > MAX_LENGTHS.businessPhone ||
    businessEmail.length > MAX_LENGTHS.businessEmail ||
    ownerName.length > MAX_LENGTHS.ownerName ||
    (suburbsCovered?.length ?? 0) > MAX_LENGTHS.suburbsCovered ||
    (googleLink?.length ?? 0) > MAX_LENGTHS.googleLink ||
    (notes?.length ?? 0) > MAX_LENGTHS.notes ||
    (referralSource?.length ?? 0) > MAX_LENGTHS.referralSource ||
    (tradingName?.length ?? 0) > MAX_LENGTHS.tradingName ||
    (existingWebsite?.length ?? 0) > MAX_LENGTHS.existingWebsite ||
    (notificationMobile?.length ?? 0) > MAX_LENGTHS.notificationMobile ||
    (openingHours?.length ?? 0) > MAX_LENGTHS.openingHours ||
    (numberPortingNotes?.length ?? 0) > MAX_LENGTHS.numberPortingNotes ||
    (websiteNotes?.length ?? 0) > MAX_LENGTHS.websiteNotes ||
    (verificationDocumentOtherDescription?.length ?? 0) > MAX_LENGTHS.verificationDocumentOtherDescription;

  if (tooLong) {
    return NextResponse.json(
      { success: false, error: "One of the fields is too long. Please shorten it and try again." },
      { status: 400, headers },
    );
  }

  const previewRequestId = await findPreviewRequestId(body.previewPublicId);

  const { data: inserted, error: insertError } = await supabaseServer
    .from("onboarding_submissions")
    .insert({
      business_name: businessName,
      abn,
      business_address: businessAddress,
      business_phone: businessPhone,
      business_email: businessEmail,
      owner_name: ownerName,
      services,
      suburbs_covered: suburbsCovered,
      colour_scheme: colourScheme,
      google_link: googleLink,
      notes,
      referral_source: referralSource,
      plan,
      preview_request_id: previewRequestId,
      trading_name: tradingName,
      existing_website: existingWebsite,
      notification_mobile: notificationMobile,
      opening_hours: openingHours,
      use_existing_number: useExistingNumber,
      number_porting_notes: numberPortingNotes,
      logo_path: logoPath,
      website_photo_paths: websitePhotoPaths,
      website_notes: websiteNotes,
      verification_document_type: verificationDocumentType,
      verification_document_path: verificationDocumentPath,
      verification_document_other_description: verificationDocumentOtherDescription,
      address_verification_document_type: addressVerificationDocumentType,
      address_verification_document_path: addressVerificationDocumentPath,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    console.error("onboarding_submissions insert failed:", insertError?.message);
    return NextResponse.json(
      { success: false, error: "We couldn't save your details. Please try again." },
      { status: 500, headers },
    );
  }

  // Reused (not re-created) after the response is sent — a slow or down
  // GHL must never delay or fail the customer-facing submission, which has
  // already succeeded in Supabase at this point.
  const submission = inserted as OnboardingSubmissionRow;
  after(() => reuseForOnboarding(submission));

  return NextResponse.json({ success: true, referenceId: inserted.public_id }, { headers });
}
