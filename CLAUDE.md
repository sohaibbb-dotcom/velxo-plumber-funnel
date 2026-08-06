@AGENTS.md

# Velxo Plumber Funnel

Marketing + lead-capture funnel for **Velxo**, a SaaS product for Australian
plumbers ("Velxo turns missed calls into booked plumbing jobs — automatically.
Instant text-backs, AI follow-up and more Google reviews"). This document is
the checkpoint baseline as of the `feature/stripe-highlevel-integration`
branch — keep it current as the app evolves.

## Architecture

- **Framework**: Next.js 16.2.10 (App Router, Turbopack), React 19, TypeScript,
  Tailwind v4, Framer Motion. Note the warning at the top of `AGENTS.md`: this
  Next.js version has breaking changes vs. older training data — check
  `node_modules/next/dist/docs/` before assuming an API.
- **Data**: Supabase Postgres, accessed only server-side via the service-role
  key (`src/lib/supabase/server.ts`, marked `server-only`). RLS is enabled
  with zero policies on every funnel table — the service-role client bypasses
  RLS; there is no public/browser read or write path.
- **Hosting**: Vercel.
- This repo is **one of several linked Velxo projects** (see "Deployment
  projects" below) — several flows here hand off to, or are consumed by,
  code that lives outside this repo.

## Production flows

1. **Preview form submission** — `src/app/preview/page.tsx` +
   `src/components/preview/PreviewRequestFlow.tsx` POST to
   `/api/preview-requests` (`src/app/api/preview-requests/route.ts`).
   Validates input, inserts a `preview_requests` row, then (after responding)
   pushes a HighLevel contact/opportunity at "New Lead" and calls the live
   site generator.
2. **Personalised preview generation** — `src/lib/preview/generator.ts`
   (`callSiteGenerator`) POSTs to the external `GENERATOR_URL` (the
   `velxo-site-generator` project), which owns the canonical site HTML. This
   app stores the returned HTML in `preview_requests.generated_html` and
   serves it back unmodified except for a small injected overlay (contrast
   fixes, a real contact form, animation polish, CTA badge) — see
   `src/app/p/[publicId]/route.ts`.
3. **Preview viewed tracking** — `GET /p/[publicId]` marks
   `preview_viewed_at` (first view only) and advances the row's HighLevel
   opportunity to "Preview Viewed" via `advancePreviewViewedById`
   (`src/lib/leadFulfillment.ts`).
4. **GHL opportunity lifecycle** — `src/lib/highlevel.ts` drives a single
   forward-only pipeline ("Velxo Clients": New Lead → Preview Viewed →
   Deposit Paid). `moveOpportunityToStage` never regresses a stage and never
   creates a duplicate opportunity for the same contact. Three call sites,
   one per funnel stage: `pushPreviewLeadToHighLevel`,
   `advancePreviewViewedById`, `reuseForOnboarding` (all in
   `leadFulfillment.ts`), and `processDepositPaid`
   (`src/lib/depositFulfillment.ts`) for the final stage.
5. **Onboarding submission** — the onboarding wizard is a **separate,
   static** project (`onboarding.html`, VELXO DIGITAL / `velxo-digital`
   Vercel project) with no backend of its own. It POSTs cross-origin to
   `/api/onboarding-submissions` (`src/app/api/onboarding-submissions/route.ts`,
   CORS-gated to an explicit origin allowlist), which inserts an
   `onboarding_submissions` row, links it back to `preview_requests` via
   `preview_request_id`, and reuses (never re-creates) the existing HighLevel
   contact/opportunity. `onboarding.html` then appends the returned
   `public_id` to the Stripe Payment Link as `client_reference_id`.
6. **Stripe webhook + idempotency** — `src/app/api/webhooks/stripe/route.ts`
   (forced `runtime = "nodejs"` for raw-body signature verification) gates on:
   signature valid → event type is `checkout.session.completed` or
   `checkout.session.async_payment_succeeded` → `payment_link` matches
   `STRIPE_DEPOSIT_PAYMENT_LINK_ID` exactly → `payment_status === "paid"` →
   idempotency lock acquired. The lock (`stripe_processed_events`,
   `src/lib/depositFulfillment.ts`) is an **insert-first, unique-violation**
   pattern, not a check-then-act read, specifically to be race-safe against
   concurrent/duplicate Stripe deliveries. On success it tags the HighLevel
   contact `"deposit paid"` and moves the opportunity to "Deposit Paid".
7. **Meta attribution capture** — `src/lib/attribution.ts` reads
   `ad_id`/`adset_id`/`campaign_id`/`creative_id`/`fbclid`/`utm_*` from the
   URL **only** on `/preview` landing, persists to `localStorage` (30-day
   TTL), and `PreviewRequestFlow.tsx` attaches it to the preview-requests
   POST. Everything downstream traces back via `preview_requests.id` /
   `preview_request_id`, never by expecting URL params to survive the whole
   funnel. Consumed by the read-only marketing-intelligence SQL layer at the
   bottom of `supabase/schema.sql` (`v_ad_funnel`, `v_ad_revenue`,
   `fn_ad_performance`, etc.), which backs a separate MCP project.

## Integrations

| Integration | Where | Notes |
|---|---|---|
| Supabase | `src/lib/supabase/server.ts` | Service-role key, server-only, RLS bypass |
| Stripe | `src/app/api/webhooks/stripe/route.ts`, `src/lib/depositFulfillment.ts` | Webhook-only in this repo; no Checkout Session creation here today |
| HighLevel (LeadConnector) | `src/lib/highlevel.ts` | v2 REST API, Private Integration Token (bearer), single sub-account |
| Site generator | `src/lib/preview/generator.ts` | External HTTP call to `velxo-site-generator`; this repo does not build preview HTML itself |
| Meta Pixel | `src/components/analytics/MetaPixel.tsx`, `src/lib/metaPixel.ts` | Client-side tracking on the marketing site |

## Current branch

`feature/stripe-highlevel-integration` — this checkpoint commit is a baseline
of everything built so far on this branch (preview funnel, attribution
capture, and the full GHL opportunity lifecycle), taken **before** starting
the AI Receptionist-first pivot below. No git remote is configured for this
repo at present.

## Deployment projects (Vercel)

- **`velxo-plumber-funnel`** (this repo) — marketing site, `/preview` funnel,
  `/p/[publicId]` preview serving, all API routes. Domain: `velxoagency.com`.
- **`velxo-digital`** — separate project hosting the static onboarding wizard
  (`onboarding.html`). Domain: `velxodigital.com`. No backend — everything it
  collects is POSTed into this repo's `/api/onboarding-submissions`.
- **`velxo-site-generator`** — external service this repo calls
  (`GENERATOR_URL`) to produce the personalised preview HTML. Owns the
  HTS-Plumbing visual system; this repo only requests, stores, and re-serves
  its output.
- **`velxo-intelligence-mcp`** / **`velxo-meta-mcp`** — separate MCP projects
  referenced in `supabase/schema.sql` comments, consuming the read-only
  marketing-intelligence views/functions and Meta ad spend sync. Not part of
  this repo; do not build their logic here.

## Do-not-break rules

- **Never trust Stripe checkout-entered contact fields.** `processDepositPaid`
  deliberately ignores `session.customer_details` and reads name/email/phone
  only from the vetted `onboarding_submissions` row, looked up strictly by
  the signed `client_reference_id`.
- **Never bypass the `stripe_processed_events` insert-first lock.** It is the
  actual concurrency-safe idempotency guard, not a nicety — removing it or
  replacing it with a "check then act" read reopens the duplicate-processing
  race it exists to close.
- **Never let `moveOpportunityToStage` regress a HighLevel opportunity**, and
  never create a second opportunity for a contact that already has one in the
  "Velxo Clients" pipeline. Stage order comes from HighLevel's own `position`
  field, fetched live — do not hardcode stage ordering.
- **Never let HighLevel (or the site generator) block or fail a
  customer-facing response.** All HighLevel calls from the lead/deposit
  fulfilment paths run via `after()`, deliberately swallow their own errors,
  and log loudly instead of throwing back to the caller.
- **Never widen `/api/onboarding-submissions`'s CORS allowlist** to a
  wildcard — it's deliberately scoped to the known onboarding domains.
- **Never remove the deposit Payment Link gate**
  (`STRIPE_DEPOSIT_PAYMENT_LINK_ID`) in the Stripe webhook — it's what keeps
  a shared webhook endpoint from misfiring on a future completion-payment
  link.
- **`supabase/schema.sql` is not auto-applied.** Any schema change here must
  be a new, additive `alter table ... add column if not exists` /
  `create table if not exists` block, applied manually via the Supabase SQL
  editor, matching the existing migration-log style of the file. Don't
  rewrite prior sections.
- **Secrets stay out of git.** `.env.local` is gitignored; only
  `.env.local.example` (placeholders) is tracked. Never hardcode API
  keys/tokens in source.
- **Do not implement the pivot below** (new pricing, trial, Stripe
  subscription, onboarding, or landing-page changes) without explicit
  instruction — this file documents the direction, not a green light.

## Upcoming: AI Receptionist-first pivot

The landing-page copy (`src/components/sections/Pricing.tsx`, `Hero.tsx`,
`Showcase.tsx`, `VelxoFeaturesBanner.tsx`) has already shifted to lead with
an **"AI Receptionist"** entry tier (missed-call text-back, AI booking
assistant) with a **"Complete"** tier bundling it with the website — including
trial copy ("30 days free · Then A$397/month · No charge today · Cancel
anytime before your trial ends"). The **backend has not caught up to this
yet**: today's live funnel is still deposit-based (A$500 deposit Payment
Link → HighLevel "Deposit Paid"), and `src/lib/routes.ts` has an explicit
`TODO` marking `TRIAL_CTA_HREF` as a placeholder ("replace with the real
trial-signup destination once onboarding and Stripe are redesigned around
card-on-file 30-day trials").

When that work starts, expect it to touch: a new Stripe subscription/trial
flow (distinct from today's one-off deposit webhook), a reworked onboarding
handoff (today's `onboarding.html` project assumes the deposit model), the
GHL pipeline/stage names in `src/lib/highlevel.ts` (currently modelled around
a one-time deposit, not a recurring trial), and `src/lib/routes.ts`'s
`TRIAL_CTA_HREF`. None of this is implemented yet — this section exists so
future work starts from an accurate picture of the gap, not a guess.
