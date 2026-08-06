import "server-only";

const GENERATOR_URL = process.env.GENERATOR_URL;
const GENERATOR_API_KEY = process.env.GENERATOR_API_KEY;
const GENERATOR_TIMEOUT_MS = 20_000;

export type GeneratorPayload = {
  businessName: string;
  phone: string;
  suburb: string;
  primaryService: string;
  services: string[];
  primaryColor: string;
  secondaryColor: string;
  website: string | null;
  publicId: string;
};

export type GeneratorResult =
  | { ok: true; html: string }
  | { ok: false; error: string };

/**
 * Calls the live Velxo site generator, which owns the canonical HTS-Plumbing
 * visual system now. This project no longer builds that HTML itself — it
 * just requests it, stores it, and serves it back unchanged.
 *
 * The generator's auth scheme isn't documented anywhere this project can
 * see, so both a bearer token and an x-api-key header are sent when
 * GENERATOR_API_KEY is set; the live endpoint accepted unauthenticated
 * requests during testing, so this degrades safely either way.
 */
export async function callSiteGenerator(payload: GeneratorPayload): Promise<GeneratorResult> {
  if (!GENERATOR_URL) {
    return { ok: false, error: "Generator URL is not configured." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATOR_TIMEOUT_MS);

  try {
    const res = await fetch(GENERATOR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GENERATOR_API_KEY
          ? { "x-api-key": GENERATOR_API_KEY, Authorization: `Bearer ${GENERATOR_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Generator returned HTTP ${res.status}${text ? `: ${text.slice(0, 300)}` : ""}` };
    }

    const data = (await res.json().catch(() => null)) as { html?: unknown } | null;
    if (!data || typeof data.html !== "string" || data.html.length === 0) {
      return { ok: false, error: "Generator response did not include HTML." };
    }

    return { ok: true, html: data.html };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Generator request timed out."
        : err instanceof Error
          ? err.message
          : "Unknown generator error.";
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
