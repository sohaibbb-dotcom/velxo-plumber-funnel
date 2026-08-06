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
  contact?: { id?: string; phone?: string };
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

  // HighLevel's upsert matches by email OR phone. If this email and phone
  // already belong to two DIFFERENT existing contacts, it keeps whichever
  // field the location is configured to match on first (this account:
  // email) and silently drops the other rather than erroring — a phone we
  // sent can go missing with zero indication anything went wrong. Confirmed
  // empirically: sending a phone already owned by another contact returns
  // 201 success with no phone on the response, no error field, nothing.
  // Surface it loudly instead of letting it disappear silently.
  if (input.phone && !data.contact?.phone) {
    console.error(
      `HighLevel contact ${contactId}: phone ${input.phone} was NOT attached. ` +
        `This usually means the number is already attached to a different HighLevel contact — ` +
        `search for it in HighLevel and merge the duplicate manually if needed.`,
    );
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

type GhlPipelineStage = { id: string; name: string; position?: number };
type GhlPipeline = { id: string; name: string; stages?: GhlPipelineStage[] };
type GhlPipelinesResponse = { pipelines?: GhlPipeline[] };

/**
 * The three sales-pipeline stages this app drives an opportunity through,
 * in funnel order. HighLevel's own `position` field on each stage (fetched
 * live, not hardcoded here) is the source of truth for ordering — this type
 * just constrains callers to stage names this codebase actually knows how
 * to target.
 */
export type OpportunityStageName = "New Lead" | "Preview Viewed" | "Deposit Paid";

let cachedPipeline: GhlPipeline | null = null;

/**
 * Resolves the "Velxo Clients" pipeline (with its full stage list) by name
 * rather than a hardcoded id, so this doesn't silently break if the
 * pipeline is ever recreated. Cached in-process for the life of the
 * serverless instance — cheap enough to skip a persistent cache.
 */
async function getPipeline(): Promise<GhlPipeline> {
  if (cachedPipeline) return cachedPipeline;
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

  cachedPipeline = pipeline;
  return pipeline;
}

function resolveStage(pipeline: GhlPipeline, stageName: OpportunityStageName): GhlPipelineStage {
  const stage = (pipeline.stages ?? []).find((s) => s.name === stageName);
  if (!stage) {
    throw new Error(`HighLevel stage "${stageName}" not found in pipeline "${PIPELINE_NAME}".`);
  }
  return stage;
}

type GhlOpportunitySearchResponse = {
  opportunities?: { id: string; pipelineStageId: string }[];
};

/** Finds this contact's existing opportunity in the given pipeline, if any. Confirmed-working endpoint. */
async function findExistingOpportunity(
  contactId: string,
  pipelineId: string,
): Promise<{ id: string; pipelineStageId: string } | null> {
  const { locationId } = requireConfig();

  const data = await ghlFetch<GhlOpportunitySearchResponse>(
    `/opportunities/search?location_id=${encodeURIComponent(locationId)}&contact_id=${encodeURIComponent(contactId)}&pipeline_id=${encodeURIComponent(pipelineId)}`,
  );

  const opportunity = (data.opportunities ?? [])[0];
  return opportunity ? { id: opportunity.id, pipelineStageId: opportunity.pipelineStageId } : null;
}

type GhlUpsertOpportunityResponse = {
  opportunity?: { id?: string };
  id?: string;
};

/**
 * Creates this contact's "Velxo Clients" opportunity if none exists yet, or
 * safely advances an existing one — never regresses a stage and never
 * creates a duplicate. Stage order is taken from HighLevel's own `position`
 * field on each stage, fetched live.
 *
 * The resolved (possibly unchanged) stage is always sent explicitly on the
 * upsert rather than omitted, so behaviour never depends on undocumented
 * "omit a field to leave it alone" semantics from HighLevel's API.
 *
 * `name` is a base label (typically the business name) — the opportunity's
 * displayed name is built from whatever stage is ACTUALLY resolved below,
 * not the caller's requested target. Otherwise a call that merely "reuses"
 * an opportunity already further along (forward-only guard keeps its real
 * stage) could still overwrite its name to claim the earlier stage it never
 * moved to.
 */
export async function moveOpportunityToStage({
  contactId,
  targetStageName,
  name,
  monetaryValue,
}: {
  contactId: string;
  targetStageName: OpportunityStageName;
  name: string;
  monetaryValue?: number;
}): Promise<{ opportunityId: string; stageName: string; created: boolean }> {
  const { locationId } = requireConfig();
  const pipeline = await getPipeline();
  const targetStage = resolveStage(pipeline, targetStageName);

  const existing = await findExistingOpportunity(contactId, pipeline.id);

  let stageIdToSet = targetStage.id;
  let resolvedStageName: string = targetStageName;

  if (existing) {
    const currentStage = pipeline.stages?.find((s) => s.id === existing.pipelineStageId);
    const currentPosition = currentStage?.position ?? -1;
    const targetPosition = targetStage.position ?? 0;

    if (currentPosition >= targetPosition) {
      // Already at this stage or further along — never move backwards.
      stageIdToSet = existing.pipelineStageId;
      resolvedStageName = currentStage?.name ?? targetStageName;
    }
  }

  const body: Record<string, unknown> = {
    locationId,
    pipelineId: pipeline.id,
    pipelineStageId: stageIdToSet,
    contactId,
    name: `${name} — ${resolvedStageName}`,
    status: "open",
  };
  if (monetaryValue !== undefined) body.monetaryValue = monetaryValue;

  const data = await ghlFetch<GhlUpsertOpportunityResponse>("/opportunities/upsert", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const opportunityId = data.opportunity?.id ?? data.id ?? existing?.id;
  if (!opportunityId) {
    throw new Error("HighLevel moveOpportunityToStage response did not include an opportunity id.");
  }
  return { opportunityId, stageName: resolvedStageName, created: !existing };
}
