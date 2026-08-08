import "server-only";
import { NextResponse } from "next/server";
import { searchBusinessCandidates } from "@/lib/google/places";

/**
 * Same-origin only — called by the onboarding wizard's Google Business
 * Profile connect step, not by any external site, so no CORS handling is
 * needed here (same pattern as /api/checkout-session).
 */

type RequestBody = { query?: unknown };

const MAX_QUERY_LENGTH = 300;

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Malformed request." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ success: false, error: "Missing search query." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ success: false, error: "Search query too long." }, { status: 400 });
  }

  const result = await searchBusinessCandidates(query);

  if (result.status === "error") {
    // Generic message only -- no API key, no raw Google error body, ever
    // reflected back to the client. Detail already logged server-side.
    return NextResponse.json({ success: false, error: "Google Places lookup failed." }, { status: 502 });
  }
  if (result.status === "not_found") {
    return NextResponse.json({ success: true, candidates: [] });
  }
  return NextResponse.json({ success: true, candidates: result.candidates });
}
