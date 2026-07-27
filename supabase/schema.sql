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
