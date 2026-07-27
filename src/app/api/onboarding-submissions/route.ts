import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

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
    (notes?.length ?? 0) > MAX_LENGTHS.notes;

  if (tooLong) {
    return NextResponse.json(
      { success: false, error: "One of the fields is too long. Please shorten it and try again." },
      { status: 400, headers },
    );
  }

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
    })
    .select("public_id")
    .single();

  if (insertError || !inserted) {
    console.error("onboarding_submissions insert failed:", insertError?.message);
    return NextResponse.json(
      { success: false, error: "We couldn't save your details. Please try again." },
      { status: 500, headers },
    );
  }

  return NextResponse.json({ success: true, referenceId: inserted.public_id }, { headers });
}
