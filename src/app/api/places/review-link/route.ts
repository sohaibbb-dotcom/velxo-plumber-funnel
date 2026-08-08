import "server-only";
import { NextResponse } from "next/server";
import { getReviewLinkForPlace } from "@/lib/google/places";

/**
 * Same-origin only, called only after the user has confirmed which
 * business is theirs (src/components/onboarding/GoogleBusinessProfileConnect.tsx)
 * — deliberately a separate route from /api/places/search so the more
 * expensive googleMapsLinks field is only ever fetched once per onboarding,
 * for the one confirmed place, never for every candidate shown.
 */

type RequestBody = { placeId?: unknown };

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Malformed request." }, { status: 400 });
  }

  const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";
  if (!placeId) {
    return NextResponse.json({ success: false, error: "Missing place id." }, { status: 400 });
  }

  const result = await getReviewLinkForPlace(placeId);

  if (result.status === "error") {
    return NextResponse.json({ success: false, error: "Google Places lookup failed." }, { status: 502 });
  }
  if (result.status === "unavailable") {
    // Not an error: the place is real and confirmed, Google just doesn't
    // expose a direct review link for it. Never fabricate one.
    return NextResponse.json({ success: true, reviewLink: null });
  }
  return NextResponse.json({ success: true, reviewLink: result.reviewLink });
}
