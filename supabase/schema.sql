-- ============================================================================
-- preview_requests
--
-- Stores instant-preview lead submissions from the /preview funnel.
-- This file is NOT run automatically. Apply it manually via the Supabase
-- SQL editor or `supabase db execute` when you're ready.
-- ============================================================================

-- gen_random_bytes() (used for public_id) lives in pgcrypto.
-- gen_random_uuid() is built into Postgres 13+ and needs no extension.
create extension if not exists pgcrypto;

create table if not exists public.preview_requests (
  -- Internal identifier. Never expose this in a URL or API response —
  -- it's sequential-adjacent in storage and only meant for internal joins.
  id uuid primary key default gen_random_uuid(),

  -- Public-facing identifier, safe to put in a shareable preview URL
  -- (e.g. /p/<public_id>). 16 random bytes = 128 bits of entropy, not
  -- guessable/enumerable.
  public_id text not null unique default encode(gen_random_bytes(16), 'hex'),

  -- ── Submitted by the prospect ─────────────────────────────────────────
  business_name   text not null,
  contact_name    text,                 -- not collected by the form yet
  email           text not null,
  phone           text not null,
  suburb          text not null,
  primary_service text not null,
  website         text,                 -- optional field on the form

  -- ── Generated/derived content (filled in after submission) ────────────
  generated_headline    text,
  generated_subheadline text,
  -- jsonb rather than text[]: the shape of a "service" may grow beyond a
  -- plain string later (e.g. {name, description}) without a migration.
  generated_services    jsonb not null default '[]'::jsonb,
  primary_color          text,
  secondary_color        text,
  -- Absolute or relative link to the generated preview (e.g.
  -- https://.../p/<public_id>). Stored explicitly rather than reconstructed
  -- on every read, since the serving domain/path scheme may change.
  preview_url            text,

  -- ── Lifecycle ───────────────────────────────────────────────────────
  -- Ordered to reflect the funnel: pending -> generated -> sent -> viewed
  -- -> onboarding -> converted, with failed/expired as off-ramps.
  status text not null default 'pending'
    check (status in (
      'pending', 'generated', 'sent', 'viewed',
      'onboarding', 'converted', 'failed', 'expired'
    )),

  -- Where the submission came from. Constrained rather than free-form so
  -- analytics queries can rely on a known set of values; extending this
  -- list is a small, explicit migration.
  source text not null default 'preview_form'
    check (source in ('preview_form', 'manual', 'referral', 'api')),

  created_at             timestamptz not null default now(),
  -- Set when the prospect actually opens their generated preview link.
  preview_viewed_at      timestamptz,
  -- Set when the prospect begins onboarding after viewing the preview.
  onboarding_started_at  timestamptz,
  updated_at             timestamptz not null default now()
);

create index if not exists preview_requests_status_idx
  on public.preview_requests (status);

create index if not exists preview_requests_created_at_idx
  on public.preview_requests (created_at desc);

-- Keep updated_at current on every row change.
create or replace function public.set_preview_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists preview_requests_set_updated_at on public.preview_requests;

create trigger preview_requests_set_updated_at
  before update on public.preview_requests
  for each row
  execute function public.set_preview_requests_updated_at();

-- ============================================================================
-- Migration: generated_html
--
-- Stores the full HTML document returned by the live site generator
-- (GENERATOR_URL) for a given request. Nullable: rows created before this
-- migration, or rows where generation failed, have no value here and the
-- /p/<public_id> route falls back to a pending/failed status page.
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
alter table public.preview_requests
  add column if not exists generated_html text;

-- ============================================================================
-- Migration: ghl_contact_id / ghl_opportunity_id on preview_requests
--
-- The top-of-funnel preview form is now the FIRST point a HighLevel
-- contact/opportunity is created (immediately on submission, at "New
-- Lead") — not just the onboarding wizard. These columns let
-- src/app/p/[publicId]/route.ts move that same opportunity to "Preview
-- Viewed" directly (no email-correlation join needed), and let
-- /api/onboarding-submissions confirm it's reusing the same record rather
-- than guessing. Nullable: rows created before this migration, or a row
-- whose HighLevel push failed, simply have no value here yet.
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
alter table public.preview_requests
  add column if not exists ghl_contact_id text,
  add column if not exists ghl_opportunity_id text;

-- ============================================================================
-- Migration: Meta attribution capture (Phase 0 of the marketing
-- intelligence architecture)
--
-- Captured once, client-side, the moment a visitor lands on /preview —
-- before any redirect can drop it. Everything downstream (onboarding,
-- Stripe) traces back to the ad via preview_requests.id, never by relying
-- on fbclid surviving the whole funnel. fbclid itself is kept only for
-- audit/debugging, not as a join key.
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
alter table public.preview_requests
  add column if not exists meta_ad_id text,
  add column if not exists meta_adset_id text,
  add column if not exists meta_campaign_id text,
  add column if not exists meta_creative_id text,
  add column if not exists fbclid text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text;

-- ============================================================================
-- onboarding_submissions
--
-- Stores the business/contact details collected by the onboarding wizard
-- (VELXO DIGITAL/onboarding.html) BEFORE the customer is sent to Stripe.
-- onboarding.html has no backend of its own, so it POSTs here via this
-- project's /api/onboarding-submissions, then appends the returned
-- `public_id` to the Stripe Payment Link as `client_reference_id` — that's
-- how the Stripe webhook (/api/webhooks/stripe) finds its way back to these
-- details to push a contact/opportunity into HighLevel after a successful
-- deposit.
--
-- The webhook trusts ONLY `public_id` (Stripe's signed client_reference_id)
-- to look up a row — never the name/email/phone Stripe's own checkout form
-- collected, which the payer could type differently or tamper with. If a
-- payment arrives with no matching public_id, it is logged as unresolved
-- rather than guessed at.
--
-- This file is NOT run automatically. Apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
create table if not exists public.onboarding_submissions (
  -- Internal identifier — never expose this in a URL or API response.
  id uuid primary key default gen_random_uuid(),

  -- Public-facing identifier: this is what's sent to the browser and what
  -- gets embedded in the Stripe Payment Link as client_reference_id. 16
  -- random bytes = 128 bits of entropy, not guessable/enumerable.
  public_id text not null unique default encode(gen_random_bytes(16), 'hex'),

  -- ── Submitted by the onboarding wizard ────────────────────────────────
  business_name    text not null,
  abn              text,
  business_address text,
  business_phone   text not null,
  business_email   text not null,
  owner_name       text not null,
  -- jsonb array of selected service names (checkbox values).
  services         jsonb not null default '[]'::jsonb,
  suburbs_covered  text,
  colour_scheme    text,
  google_link      text,
  notes            text,

  -- ── Lifecycle ─────────────────────────────────────────────────────────
  status text not null default 'pending'
    check (status in ('pending', 'deposit_paid', 'completed', 'failed')),

  -- ── Stripe payment data (filled in by the webhook once paid) ──────────
  stripe_session_id  text,
  stripe_customer_id text,
  -- Raw payment_status straight from Stripe ('paid', 'unpaid', etc) — kept
  -- distinct from the funnel-lifecycle `status` above.
  payment_status     text,
  deposit_paid_at     timestamptz,
  -- The specific Stripe event id that marked this row paid. Belt-and-braces
  -- alongside the stripe_processed_events table below: that table is the
  -- actual concurrency-safe idempotency lock; this column is for
  -- observability (e.g. "which event produced this row's HighLevel push").
  webhook_event_id    text,

  -- ── HighLevel push results, for debugging/idempotency ─────────────────
  ghl_contact_id      text,
  ghl_opportunity_id  text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_onboarding_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists onboarding_submissions_set_updated_at on public.onboarding_submissions;

create trigger onboarding_submissions_set_updated_at
  before update on public.onboarding_submissions
  for each row
  execute function public.set_onboarding_submissions_updated_at();

alter table public.onboarding_submissions enable row level security;

-- ============================================================================
-- Migration: preview_request_id on onboarding_submissions
--
-- The real join key back to preview_requests (and from there, the Meta
-- attribution captured on it) — set from the `preview` id onboarding.html
-- already carries in its URL, looked up server-side. Deliberately just a
-- foreign key, not a copy of the attribution columns themselves: the join
-- is one query away, so there's nothing to keep in sync.
-- Nullable: a submission can arrive without ever having gone through
-- /preview (e.g. a direct onboarding link).
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
alter table public.onboarding_submissions
  add column if not exists preview_request_id uuid references public.preview_requests(id);

-- ============================================================================
-- stripe_processed_events
--
-- The real idempotency lock for the Stripe webhook. Stripe can and does
-- redeliver the same event (retries, occasional duplicate sends), including
-- two deliveries arriving concurrently — a "check if already processed,
-- then act" read is not safe against that race. Instead, the webhook
-- attempts to INSERT the event id here FIRST; a unique-violation means this
-- event is already being handled (by this request or a concurrent one), so
-- it aborts before touching HighLevel or Supabase again. This is what
-- actually prevents duplicate tags/contacts/opportunities/workflow-triggered
-- emails on retry — not just a nicety.
-- ============================================================================
create table if not exists public.stripe_processed_events (
  event_id   text primary key,
  created_at timestamptz not null default now()
);

alter table public.stripe_processed_events enable row level security;

-- ============================================================================
-- Security
--
-- RLS is enabled with NO policies attached. With RLS on and zero policies,
-- every role subject to RLS (anon, authenticated) is denied all access by
-- default — there is no public read, write, or update path to this table.
--
-- The server-only Supabase client (src/lib/supabase/server.ts) authenticates
-- with the service-role secret key, which bypasses RLS entirely, so it can
-- still insert/select/update freely from API routes.
--
-- If a future feature needs the browser to read preview data directly
-- (skipping a server round-trip), add a narrowly-scoped SELECT policy at
-- that time — e.g. against a view that excludes email/phone — rather than
-- opening the base table.
-- ============================================================================
alter table public.preview_requests enable row level security;

-- ============================================================================
-- Migration: Phase 1 — read-only marketing intelligence layer
--
-- Adds:
--   - client_id on the funnel spine tables, defaulted to 'velxo' — Velxo is
--     the only tenant today, but every table a future client's data could
--     live in needs this column now so onboarding a second client is a
--     WHERE clause later, not a migration.
--   - ad_daily_spend: a lightweight daily snapshot of Meta spend/impressions
--     /clicks per ad, synced from the Meta MCP. NOT a copy of Meta's rich
--     object model — just enough to JOIN spend against funnel outcomes in
--     plain SQL, which a live API call per query can't do efficiently.
--   - v_ad_funnel / v_ad_revenue: views, not tables — every field here
--     already exists on preview_requests/onboarding_submissions; these
--     make the join reusable instead of duplicating data.
--   - fn_ad_performance / fn_funnel_breakdown: Postgres FUNCTIONS, not
--     plain views, specifically because every metric needs a caller-
--     supplied date window — a view can't take parameters, and baking an
--     implicit "all time" window into a view is exactly what "every metric
--     needs a clearly defined date window" rules out.
--
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================

alter table public.preview_requests
  add column if not exists client_id text not null default 'velxo';

alter table public.onboarding_submissions
  add column if not exists client_id text not null default 'velxo';

-- ── ad_daily_spend ──────────────────────────────────────────────────────────
-- One row per (client_id, ad_id, date). Populated by a sync step that calls
-- the Meta Marketing API directly (velxo-intelligence-mcp's
-- scripts/sync-ad-spend.ts) — the Meta MCP itself stays completely
-- unmodified and read-only; this is a separate, one-way consumer of Meta's
-- public API using the same read-only credentials. Not on a schedule yet —
-- run manually until a cron trigger is wired up.
create table if not exists public.ad_daily_spend (
  id          uuid primary key default gen_random_uuid(),
  client_id   text not null default 'velxo',
  ad_id       text not null,
  date        date not null,
  spend_aud   numeric not null default 0,
  impressions integer not null default 0,
  clicks      integer not null default 0,
  link_clicks integer not null default 0,
  synced_at   timestamptz not null default now(),
  unique (client_id, ad_id, date)
);

create index if not exists ad_daily_spend_ad_id_idx on public.ad_daily_spend (client_id, ad_id, date);

alter table public.ad_daily_spend enable row level security;

-- ── v_ad_funnel ─────────────────────────────────────────────────────────────
-- One row per preview_requests row — the funnel spine, per lead.
create or replace view public.v_ad_funnel as
select
  pr.client_id,
  pr.id as preview_request_id,
  pr.meta_ad_id,
  pr.meta_adset_id,
  pr.meta_campaign_id,
  pr.meta_creative_id,
  pr.suburb,
  pr.created_at as preview_requested_at,
  pr.preview_viewed_at,
  (pr.preview_viewed_at is not null) as was_viewed,
  os.id as onboarding_submission_id,
  os.created_at as onboarding_submitted_at,
  (os.id is not null) as did_onboard,
  os.status as onboarding_status,
  (os.status = 'deposit_paid') as did_deposit,
  os.deposit_paid_at
from public.preview_requests pr
left join public.onboarding_submissions os on os.preview_request_id = pr.id;

-- ── v_ad_revenue ────────────────────────────────────────────────────────────
-- One row per paid deposit, derived entirely from onboarding_submissions'
-- existing payment columns — no new revenue_events TABLE, since there's
-- nothing to store that isn't already captured there. amount_aud mirrors
-- DEPOSIT_VALUE_AUD in src/lib/highlevel.ts; this is the one place a real
-- per-transaction amount column would replace a hardcoded constant once
-- pricing varies (completion payments, tiers, refunds).
create or replace view public.v_ad_revenue as
select
  os.client_id,
  os.id as onboarding_submission_id,
  os.preview_request_id,
  os.stripe_session_id,
  os.deposit_paid_at as paid_at,
  500::numeric as amount_aud,
  'deposit'::text as payment_type
from public.onboarding_submissions os
where os.status = 'deposit_paid';

-- ── fn_ad_performance ───────────────────────────────────────────────────────
-- The one function backing every ad-level MCP tool — get_ad_funnel_performance,
-- get_ad_revenue_performance, compare_ads, and get_top_creative_angles all
-- call this with different ad_id filters applied, not different SQL.
-- p_ad_ids null = every ad seen in the window. Starts from a full outer
-- join and coalesces to 0 so an ad with spend but zero leads, or leads but
-- zero deposits, is returned with zeros rather than dropped.
create or replace function public.fn_ad_performance(
  p_client_id text,
  p_since date,
  p_until date,
  p_ad_ids text[] default null
)
returns table (
  client_id text,
  meta_ad_id text,
  preview_requests bigint,
  preview_views bigint,
  onboarding_submissions bigint,
  deposits bigint,
  revenue_aud numeric,
  spend_aud numeric,
  impressions bigint,
  clicks bigint
)
language sql
stable
as $$
  with funnel_agg as (
    select
      f.client_id,
      f.meta_ad_id,
      count(*) as preview_requests,
      count(*) filter (where f.was_viewed) as preview_views,
      count(*) filter (where f.did_onboard) as onboarding_submissions,
      count(*) filter (where f.did_deposit) as deposits
    from public.v_ad_funnel f
    where f.meta_ad_id is not null
      and f.client_id = p_client_id
      and f.preview_requested_at::date between p_since and p_until
      and (p_ad_ids is null or f.meta_ad_id = any(p_ad_ids))
    group by f.client_id, f.meta_ad_id
  ),
  revenue_agg as (
    select
      f.client_id,
      f.meta_ad_id,
      coalesce(sum(r.amount_aud), 0) as revenue_aud
    from public.v_ad_funnel f
    join public.v_ad_revenue r on r.preview_request_id = f.preview_request_id
    where f.meta_ad_id is not null
      and f.client_id = p_client_id
      and r.paid_at::date between p_since and p_until
      and (p_ad_ids is null or f.meta_ad_id = any(p_ad_ids))
    group by f.client_id, f.meta_ad_id
  ),
  spend_agg as (
    select
      s.client_id,
      s.ad_id as meta_ad_id,
      sum(s.spend_aud) as spend_aud,
      sum(s.impressions) as impressions,
      sum(s.clicks) as clicks
    from public.ad_daily_spend s
    where s.client_id = p_client_id
      and s.date between p_since and p_until
      and (p_ad_ids is null or s.ad_id = any(p_ad_ids))
    group by s.client_id, s.ad_id
  )
  select
    coalesce(fa.client_id, sa.client_id) as client_id,
    coalesce(fa.meta_ad_id, sa.meta_ad_id) as meta_ad_id,
    coalesce(fa.preview_requests, 0) as preview_requests,
    coalesce(fa.preview_views, 0) as preview_views,
    coalesce(fa.onboarding_submissions, 0) as onboarding_submissions,
    coalesce(fa.deposits, 0) as deposits,
    coalesce(ra.revenue_aud, 0) as revenue_aud,
    coalesce(sa.spend_aud, 0) as spend_aud,
    coalesce(sa.impressions, 0) as impressions,
    coalesce(sa.clicks, 0) as clicks
  from funnel_agg fa
  full outer join spend_agg sa on sa.meta_ad_id = fa.meta_ad_id and sa.client_id = fa.client_id
  left join revenue_agg ra
    on ra.meta_ad_id = coalesce(fa.meta_ad_id, sa.meta_ad_id)
    and ra.client_id = coalesce(fa.client_id, sa.client_id);
$$;

-- ── fn_funnel_breakdown ─────────────────────────────────────────────────────
-- Groups the funnel by a dimension already captured on preview_requests —
-- no new columns needed for suburb or day/hour. Backs get_funnel_breakdown.
create or replace function public.fn_funnel_breakdown(
  p_client_id text,
  p_since date,
  p_until date,
  p_dimension text, -- 'suburb' | 'day_of_week' | 'hour_of_day'
  p_ad_id text default null
)
returns table (
  dimension_value text,
  preview_requests bigint,
  preview_views bigint,
  onboarding_submissions bigint,
  deposits bigint
)
language sql
stable
as $$
  select
    case p_dimension
      when 'suburb' then f.suburb
      when 'day_of_week' then to_char(f.preview_requested_at, 'Day')
      when 'hour_of_day' then to_char(f.preview_requested_at, 'HH24') || ':00'
      else 'unknown'
    end as dimension_value,
    count(*) as preview_requests,
    count(*) filter (where f.was_viewed) as preview_views,
    count(*) filter (where f.did_onboard) as onboarding_submissions,
    count(*) filter (where f.did_deposit) as deposits
  from public.v_ad_funnel f
  where f.client_id = p_client_id
    and f.preview_requested_at::date between p_since and p_until
    and (p_ad_id is null or f.meta_ad_id = p_ad_id)
  group by 1
  order by 2 desc;
$$;

-- ── fn_creative_performance ─────────────────────────────────────────────────
-- Backs get_top_creative_angles. Grouped by meta_creative_id rather than
-- meta_ad_id — "angle" currently means Meta's creative_id, since no
-- separate angle/hook taxonomy is captured yet (that's a Phase 4 concern,
-- not built here). Spend has no direct per-creative column to read (Meta
-- insights are fetched per-ad, not per-creative) — this attributes an ad's
-- spend to whichever creative(s) that ad showed leads for in the window,
-- via array_agg(distinct meta_ad_id). That's an approximation: correct as
-- long as an ad's creative doesn't change mid-flight, which is true for
-- every ad running today, but worth revisiting if that ever changes.
create or replace function public.fn_creative_performance(
  p_client_id text,
  p_since date,
  p_until date
)
returns table (
  client_id text,
  meta_creative_id text,
  preview_requests bigint,
  preview_views bigint,
  onboarding_submissions bigint,
  deposits bigint,
  revenue_aud numeric,
  spend_aud numeric,
  impressions bigint,
  clicks bigint
)
language sql
stable
as $$
  with funnel_agg as (
    select
      f.client_id,
      f.meta_creative_id,
      count(*) as preview_requests,
      count(*) filter (where f.was_viewed) as preview_views,
      count(*) filter (where f.did_onboard) as onboarding_submissions,
      count(*) filter (where f.did_deposit) as deposits,
      array_agg(distinct f.meta_ad_id) filter (where f.meta_ad_id is not null) as ad_ids
    from public.v_ad_funnel f
    where f.meta_creative_id is not null
      and f.client_id = p_client_id
      and f.preview_requested_at::date between p_since and p_until
    group by f.client_id, f.meta_creative_id
  ),
  revenue_agg as (
    select
      f.client_id,
      f.meta_creative_id,
      coalesce(sum(r.amount_aud), 0) as revenue_aud
    from public.v_ad_funnel f
    join public.v_ad_revenue r on r.preview_request_id = f.preview_request_id
    where f.meta_creative_id is not null
      and f.client_id = p_client_id
      and r.paid_at::date between p_since and p_until
    group by f.client_id, f.meta_creative_id
  ),
  spend_agg as (
    select
      fa.client_id,
      fa.meta_creative_id,
      coalesce(sum(s.spend_aud), 0) as spend_aud,
      coalesce(sum(s.impressions), 0) as impressions,
      coalesce(sum(s.clicks), 0) as clicks
    from funnel_agg fa
    left join public.ad_daily_spend s
      on s.client_id = fa.client_id
      and s.ad_id = any(fa.ad_ids)
      and s.date between p_since and p_until
    group by fa.client_id, fa.meta_creative_id
  )
  select
    fa.client_id,
    fa.meta_creative_id,
    fa.preview_requests,
    fa.preview_views,
    fa.onboarding_submissions,
    fa.deposits,
    coalesce(ra.revenue_aud, 0) as revenue_aud,
    coalesce(sp.spend_aud, 0) as spend_aud,
    coalesce(sp.impressions, 0) as impressions,
    coalesce(sp.clicks, 0) as clicks
  from funnel_agg fa
  left join revenue_agg ra on ra.meta_creative_id = fa.meta_creative_id and ra.client_id = fa.client_id
  left join spend_agg sp on sp.meta_creative_id = fa.meta_creative_id and sp.client_id = fa.client_id;
$$;

-- ============================================================================
-- Migration: Stripe subscription fields on onboarding_submissions
--
-- Phase 1 of the AI Receptionist-first subscription pivot (see CLAUDE.md).
-- Backend foundation only — nothing writes trial_starts_at/subscription_status
-- /etc yet (that's Phase 2's webhook). All nullable, added now so Phase 2
-- doesn't need a second manual SQL Editor pass.
--
-- `plan` distinguishes which subscription product a submission is for.
-- Canonical values only ('ai_receptionist' | 'complete') — see
-- src/lib/plans.ts, the single source of truth every other file imports
-- from. Nullable: legacy onboarding.html submissions don't send it yet.
--
-- stripe_session_id and stripe_customer_id are NOT added here — they
-- already exist on this table (added for the deposit flow) and are reused
-- as-is: a given row is only ever driven by one Stripe flow (legacy
-- deposit or new subscription), so there's no ambiguity in sharing them.
--
-- referral_source is unrelated to Stripe — captured here opportunistically
-- while this table is already being migrated ("How did you hear about us?").
--
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
alter table public.onboarding_submissions
  add column if not exists plan text check (plan in ('ai_receptionist', 'complete')),
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists subscription_status text,
  add column if not exists trial_starts_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists payment_method_status text,
  add column if not exists referral_source text;

-- ============================================================================
-- Migration: onboarding activation redesign (Phase 4)
--
-- Backs the redesigned in-app /onboarding wizard (src/app/onboarding) —
-- moves it from a generic "client form" to the fields actually needed to
-- activate and provision the AI Receptionist (plus, for the Complete plan
-- only, the website build). All additive and nullable: legacy
-- onboarding.html submissions never send any of these, and several are only
-- ever populated depending on plan or which verification document type was
-- chosen. Required-ness for the new in-app wizard is enforced in
-- src/app/api/onboarding-submissions/route.ts, not by a NOT NULL constraint
-- here — a NOT NULL would also break every legacy onboarding.html insert.
--
-- ── AI-configuration fields (both plans; both need the receptionist) ──────
-- notification_mobile: where the owner is alerted about missed calls/jobs —
-- deliberately separate from business_phone, which may be the number being
-- forwarded/replaced rather than a place to actually reach the owner.
-- use_existing_number + number_porting_notes: whether to forward the
-- existing business_phone instead of provisioning a new Velxo number.
--
-- ── Business verification (see verificationDocuments.ts) ──────────────────
-- Two independent documents because one document alone doesn't always prove
-- both "the business exists" and "it operates from this address" — see
-- requiresAddressProof() in src/lib/onboarding/verificationDocuments.ts,
-- the single source of truth for which primary document types need the
-- second upload. verification_document_other_description is only ever
-- populated when verification_document_type = 'other' — enforced at the API
-- layer, kept as its own column rather than overloading `notes`.
-- Paths point into the PRIVATE 'onboarding-uploads' Storage bucket below —
-- never a public URL.
--
-- ── Website Setup fields (Complete plan only) ──────────────────────────────
-- logo_path / website_photo_paths point into the same private bucket.
-- website_notes is deliberately separate from `notes` (Teach Your AI's
-- free-text field) — they answer different questions for different steps.
--
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
alter table public.onboarding_submissions
  add column if not exists trading_name text,
  add column if not exists existing_website text,
  add column if not exists notification_mobile text,
  add column if not exists opening_hours text,
  add column if not exists offers_emergency_service boolean,
  add column if not exists booking_method text,
  add column if not exists ai_offers_booking_times boolean,
  add column if not exists booking_destination text,
  add column if not exists urgent_job_handling text,
  add column if not exists use_existing_number boolean,
  add column if not exists number_porting_notes text,
  add column if not exists logo_path text,
  add column if not exists website_photo_paths jsonb not null default '[]'::jsonb,
  add column if not exists website_notes text,
  add column if not exists verification_document_type text
    check (verification_document_type in (
      'abn_registration_asic_extract',
      'business_licence',
      'electricity_bill',
      'gas_bill',
      'water_bill',
      'internet_nbn_bill',
      'council_rates_notice',
      'commercial_lease_agreement',
      'bank_statement',
      'other'
    )),
  add column if not exists verification_document_path text,
  add column if not exists verification_document_other_description text,
  add column if not exists address_verification_document_type text
    check (address_verification_document_type in (
      'electricity_bill',
      'gas_bill',
      'water_bill',
      'internet_nbn_bill',
      'council_rates_notice',
      'commercial_lease_agreement',
      'bank_statement'
    )),
  add column if not exists address_verification_document_path text;

-- ============================================================================
-- Storage: onboarding-uploads bucket
--
-- Holds business-verification documents, proof-of-address documents, and
-- (Complete plan) logo/website-photo uploads. PRIVATE — public = false, and
-- deliberately given NO RLS policies on storage.objects, so anon/
-- authenticated roles get zero access (same "RLS on, zero policies" pattern
-- already used for every table in this file). Only the server-only
-- service-role client (src/lib/supabase/server.ts, used from
-- src/lib/onboarding/documentUpload.ts) can read or write it. Storage paths
-- are random UUIDs generated server-side, never derived from the uploaded
-- filename or exposed as a public URL.
--
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('onboarding-uploads', 'onboarding-uploads', false)
on conflict (id) do nothing;

-- ============================================================================
-- Migration: repeat free-trial protection index
--
-- Speeds up hasPriorTrial's (src/lib/onboarding/trialEligibility.ts) lookup
-- of prior trial history, which filters on trial_starts_at IS NOT NULL —
-- the sole, webhook-confirmed proof a business identity already received a
-- trial (never merely submitting onboarding or opening/abandoning
-- Checkout). Partial index, since only rows past that point are ever
-- queried. No new column, no uniqueness constraint: business_email/
-- business_phone/abn are compared in application code after normalization
-- (AU phone formats vary too much for a plain equality filter), so no index
-- on those columns is needed for this feature.
--
-- This file is NOT run automatically — apply manually via the Supabase SQL
-- editor, same as the rest of this file.
-- ============================================================================
create index if not exists onboarding_submissions_trial_started_idx
  on public.onboarding_submissions (trial_starts_at)
  where trial_starts_at is not null;
