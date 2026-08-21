/**
 * Shared request-body sanitization primitives for onboarding submission
 * endpoints (/api/onboarding-submissions for Phase 1 create,
 * /api/onboarding-setup for Phase 2 update) — kept in one place so both
 * never drift on what counts as a safe string/array/boolean/URL.
 */

export function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function stripHtml(value: string): string {
  return value.replace(/[<>]/g, "");
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => stripHtml(v.trim()))
    .filter(Boolean)
    .slice(0, 50);
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Google review automation needs a real, resolvable destination — http(s) only. */
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
