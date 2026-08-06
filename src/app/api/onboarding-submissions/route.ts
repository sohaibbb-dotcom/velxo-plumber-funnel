import "server-only";
import { NextResponse, after } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { reuseForOnboarding } from "@/lib/leadFulfillment";
import { isPlan } from "@/lib/plans";
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
    (referralSource?.length ?? 0) > MAX_LENGTHS.referralSource;

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
