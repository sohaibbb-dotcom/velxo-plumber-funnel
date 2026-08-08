import "server-only";
import type { GooglePlaceCandidate } from "@/lib/google/types";

/**
 * Server-only wrapper around Google Places API (New) — never the legacy
 * Places API, which uses a different host/response shape entirely. Two
 * calls, deliberately kept separate:
 *
 *  - Text Search: cheap fields only (id/name/address/rating), run once per
 *    onboarding search (initial auto-search + any manual refinements).
 *  - Place Details: only ever called ONCE, after the user has actually
 *    confirmed which business is theirs — it's the call that carries the
 *    higher-cost `googleMapsLinks` field, so it's deliberately not fetched
 *    for every candidate up front.
 *
 * GOOGLE_PLACES_API_KEY never leaves this file — every function here
 * returns only the fields the UI needs, never the raw Google response.
 */

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";

export type PlacesSearchResult =
  | { status: "found"; candidates: GooglePlaceCandidate[] }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type ReviewLinkResult =
  | { status: "found"; reviewLink: string }
  | { status: "unavailable" }
  | { status: "error"; message: string };

type TextSearchPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
};

export async function searchBusinessCandidates(query: string): Promise<PlacesSearchResult> {
  const trimmed = query.trim();
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Missing environment variable: GOOGLE_PLACES_API_KEY");
    return { status: "error", message: "Google Places is not configured." };
  }
  if (!trimmed) {
    return { status: "error", message: "Missing search query." };
  }

  let res: Response;
  try {
    res = await fetch(TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({ textQuery: trimmed, maxResultCount: 5 }),
    });
  } catch (err) {
    console.error("Google Places Text Search request failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: "Google Places lookup failed." };
  }

  if (!res.ok) {
    // Logged server-side only -- Google's error body can include request
    // context we don't want reflected back to the browser.
    const errBody = await res.text().catch(() => "");
    console.error(`Google Places Text Search returned ${res.status}:`, errBody);
    return { status: "error", message: "Google Places lookup failed." };
  }

  const data = (await res.json().catch(() => null)) as { places?: TextSearchPlace[] } | null;
  const places = data?.places ?? [];

  const candidates: GooglePlaceCandidate[] = places
    .filter((p): p is TextSearchPlace & { id: string } => typeof p.id === "string" && p.id.length > 0)
    .map((p) => ({
      placeId: p.id,
      name: p.displayName?.text?.trim() || "Unnamed business",
      formattedAddress: p.formattedAddress?.trim() || "",
      rating: typeof p.rating === "number" ? p.rating : undefined,
      userRatingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : undefined,
    }));

  if (candidates.length === 0) {
    return { status: "not_found" };
  }

  return { status: "found", candidates };
}

/**
 * Never fabricates a link: if Google's response has no
 * googleMapsLinks.writeAReviewUri for this place, returns "unavailable"
 * rather than substituting a constructed/guessed URL.
 */
export async function getReviewLinkForPlace(placeId: string): Promise<ReviewLinkResult> {
  const trimmed = placeId.trim();
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Missing environment variable: GOOGLE_PLACES_API_KEY");
    return { status: "error", message: "Google Places is not configured." };
  }
  if (!trimmed) {
    return { status: "error", message: "Missing place id." };
  }

  let res: Response;
  try {
    res = await fetch(`${PLACE_DETAILS_URL}/${encodeURIComponent(trimmed)}`, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "googleMapsLinks.writeAReviewUri",
      },
    });
  } catch (err) {
    console.error("Google Places Details request failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: "Google Places lookup failed." };
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`Google Places Details returned ${res.status}:`, errBody);
    return { status: "error", message: "Google Places lookup failed." };
  }

  const data = (await res.json().catch(() => null)) as {
    googleMapsLinks?: { writeAReviewUri?: string };
  } | null;

  const reviewLink = data?.googleMapsLinks?.writeAReviewUri;
  if (!reviewLink) {
    return { status: "unavailable" };
  }

  return { status: "found", reviewLink };
}
