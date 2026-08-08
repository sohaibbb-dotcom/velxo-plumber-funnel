/**
 * Plain, environment-agnostic types shared between the server-only Places
 * resolver (src/lib/google/places.ts) and the client-side onboarding
 * components — no runtime code, no secrets, safe to import from either side.
 */
export type GooglePlaceCandidate = {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  userRatingCount?: number;
};
