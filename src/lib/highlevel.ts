import "server-only";

/**
 * HighLevel (LeadConnector) API v2 client, scoped to exactly what the Stripe
 * deposit-paid webhook needs: upsert a contact, tag it, and upsert an
 * opportunity in a named pipeline/stage.
 *
 * Auth is a per-sub-account Private Integration Token (Settings -> Private
 * Integrations in the HighLevel sub-account), sent as a bearer token — not
 * the OAuth2 marketplace-app flow, which is unnecessary for a single
 * sub-account and would add a redirect/token-refresh flow for no benefit
 * here.
 *
 * Field names below follow HighLevel's stable, published v2 contract as of
 * this writing. Their interactive docs are a JS-rendered app that couldn't
 * be fully scraped to double-check every field live — verify against a
 * sandbox call (see resolvePipelineStage, which is a safe read-only call)
 * before relying on this against real customer payments.
 */

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

const GHL_API_KEY = process.env.HIGHLEVEL_API_KEY;
const GHL_LOCATION_ID = process.env.HIGHLEVEL_LOCATION_ID;

/** Business configuration, not secrets — deliberately not env vars. */
const PIPELINE_NAME = "Velxo Clients";
const STAGE_NAME = "Deposit Paid";
export const DEPOSIT_PAID_TAG = "deposit paid";
export const DEPOSIT_VALUE_AUD = 500;

function requireConfig(): { apiKey: string; locationId: string } {
  if (!GHL_API_KEY) throw new Error("Missing environment variable: HIGHLEVEL_API_KEY");
  if (!GHL_LOCATION_ID) throw new Error("Missing environment variable: HIGHLEVEL_LOCATION_ID");
  return { apiKey: GHL_API_KEY, locationId: GHL_LOCATION_ID };
}

async function ghlFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { apiKey } = requireConfig();

  const res = await fetch(`${GHL_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: GHL_API_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HighLevel ${path} returned HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  return res.json() as Promise<T>;
}

export type HighLevelContactInput = {
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  businessName: string;
};

type GhlUpsertContactResponse = {
  contact?: { id?: string };
  id?: string;
};

export async function upsertContact(input: HighLevelContactInput): Promise<{ contactId: string }> {
  const { locationId } = requireConfig();

  const data = await ghlFetch<GhlUpsertContactResponse>("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId,
      email: input.email,
      phone: input.phone || undefined,
      firstName: input.firstName,
      lastName: input.lastName,
      companyName: input.businessName,
      source: "Velxo Onboarding",
    }),
  });

  const contactId = data.contact?.id ?? data.id;
  if (!contactId) {
    throw new Error("HighLevel upsertContact response did not include a contact id.");
  }
  return { contactId };
}

/**
 * Adds a tag via HighLevel's dedicated tags endpoint rather than the
 * contact-upsert body — the upsert's own `tags` field risks being treated
 * as a full replace on update in some API versions, which would silently
 * wipe out any tags applied by other HighLevel automations. The dedicated
 * endpoint is additive by design.
 */
export async function addTag(contactId: string, tag: string): Promise<void> {
  await ghlFetch(`/contacts/${encodeURIComponent(contactId)}/tags`, {
    method: "POST",
    body: JSON.stringify({ tags: [tag] }),
  });
}

type GhlPipelineStage = { id: string; name: string };
type GhlPipeline = { id: string; name: string; stages?: GhlPipelineStage[] };
type GhlPipelinesResponse = { pipelines?: GhlPipeline[] };

let cachedPipelineStage: { pipelineId: string; stageId: string } | null = null;

/**
 * Resolves the "Velxo Clients" pipeline and "Deposit Paid" stage by name
 * rather than a hardcoded id, so this doesn't silently break if the
 * pipeline is ever recreated. Cached in-process for the life of the
 * serverless instance — cheap enough to skip a persistent cache.
 */
export async function resolvePipelineStage(): Promise<{ pipelineId: string; stageId: string }> {
  if (cachedPipelineStage) return cachedPipelineStage;
  const { locationId } = requireConfig();

  const data = await ghlFetch<GhlPipelinesResponse>(
    `/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`,
  );

  const pipeline = (data.pipelines ?? []).find((p) => p.name === PIPELINE_NAME);
  if (!pipeline) {
    throw new Error(
      `HighLevel pipeline "${PIPELINE_NAME}" not found for this location. Check it exists and is named exactly "${PIPELINE_NAME}".`,
    );
  }

  const stage = (pipeline.stages ?? []).find((s) => s.name === STAGE_NAME);
  if (!stage) {
    throw new Error(
      `HighLevel stage "${STAGE_NAME}" not found in pipeline "${PIPELINE_NAME}".`,
    );
  }

  cachedPipelineStage = { pipelineId: pipeline.id, stageId: stage.id };
  return cachedPipelineStage;
}

type GhlUpsertOpportunityResponse = {
  opportunity?: { id?: string };
  id?: string;
};

export async function upsertOpportunity({
  contactId,
  name,
}: {
  contactId: string;
  name: string;
}): Promise<{ opportunityId: string }> {
  const { locationId } = requireConfig();
  const { pipelineId, stageId } = await resolvePipelineStage();

  const data = await ghlFetch<GhlUpsertOpportunityResponse>("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId,
      pipelineId,
      pipelineStageId: stageId,
      contactId,
      name,
      status: "open",
      monetaryValue: DEPOSIT_VALUE_AUD,
    }),
  });

  const opportunityId = data.opportunity?.id ?? data.id;
  if (!opportunityId) {
    throw new Error("HighLevel upsertOpportunity response did not include an opportunity id.");
  }
  return { opportunityId };
}
