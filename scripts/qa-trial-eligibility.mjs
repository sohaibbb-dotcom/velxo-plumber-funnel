#!/usr/bin/env node
/**
 * Regression coverage for the trial-eligibility / $0-due-today invariant.
 *
 * Not a unit test — this repo has no test framework (no Jest/Vitest, no
 * "test" script). This is a live-integration QA script: it talks to a
 * running local dev server (`npm run dev` on http://localhost:3000) AND the
 * real Stripe API (using whatever key is in .env.local — this project's is
 * LIVE, not test mode). It only ever CREATES Checkout Sessions and reads
 * them back; it never completes a payment, so it never risks a real charge.
 * Every row/session it creates is deleted or left harmlessly unpaid.
 *
 * Run manually: `npm run qa:trial-eligibility` (dev server must already be running).
 *
 * Covers:
 *  1. NEW eligible customer -> trial applied -> amount_total = 0
 *  2. PRIOR trial customer (synthetic, webhook-confirmed-shaped row) -> no second trial
 *  3. Abandoned/uncompleted Checkout Session does NOT consume trial eligibility
 *  4. The fail-closed invariant in createSubscriptionCheckoutSession (code-review
 *     verified below, not independently forced — see note in that section)
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { readFileSync } from "node:fs";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? `: ${JSON.stringify(detail)}` : ""}`);
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

function randomIdentity() {
  const rand = Math.random().toString(36).slice(2, 12);
  return {
    email: `qa-trial-invariant-${rand}@example.com`,
    phone: "0400" + Math.floor(100000 + Math.random() * 899999),
  };
}

async function createMinimalSubmission(identity, label) {
  const created = await post("/api/onboarding-submissions", {
    businessName: `TEST QA-Trial-Invariant ${label} (QA)`,
    ownerName: "Test Owner",
    businessPhone: identity.phone,
    businessEmail: identity.email,
    plan: "ai_receptionist",
  });
  if (!created.json?.success) throw new Error(`submission create failed: ${JSON.stringify(created.json)}`);
  return created.json.referenceId;
}

async function retrieveSessionTruth(checkoutUrl) {
  const match = checkoutUrl.match(/cs_(live|test)_[a-zA-Z0-9]+/);
  const session = await stripe.checkout.sessions.retrieve(match[0]);
  return {
    amount_total: session.amount_total,
    mode: session.mode,
    custom_text_submit: session.custom_text?.submit?.message ?? null,
  };
}

async function cleanupRows(pattern) {
  await supabase.from("onboarding_submissions").delete().ilike("business_name", pattern);
}

// ── Case 1: NEW eligible customer -----------------------------------------
async function caseNewCustomer() {
  const identity = randomIdentity();
  const publicId = await createMinimalSubmission(identity, "NEW");
  const checkout = await post("/api/checkout-session", { publicId });
  if (!checkout.json?.success) {
    record("New eligible customer -> $0 due today", false, checkout.json);
    return;
  }
  const truth = await retrieveSessionTruth(checkout.json.url);
  record("New eligible customer -> $0 due today", truth.amount_total === 0 && truth.mode === "subscription", truth);
  record("New eligible customer -> custom_text mentions $0 due today", !!truth.custom_text_submit?.includes("A$0 due today"), { custom_text_submit: truth.custom_text_submit });
  return identity;
}

// ── Case 2: genuine PRIOR trial customer -----------------------------------
async function casePriorTrialCustomer() {
  const identity = randomIdentity();
  // Simulate a genuinely webhook-confirmed prior trial: insert a row with
  // trial_starts_at set directly, the same shape processSubscriptionStarted
  // produces — this is what "a real customer already consumed a trial"
  // looks like in the database, independent of how it got there.
  const { data: priorRow, error } = await supabase
    .from("onboarding_submissions")
    .insert({
      business_name: "TEST QA-Trial-Invariant PRIOR-SEED (QA)",
      owner_name: "Test Owner",
      business_phone: identity.phone,
      business_email: identity.email,
      plan: "ai_receptionist",
      trial_starts_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`prior-trial seed insert failed: ${error.message}`);

  // Now the SAME identity submits again through Phase 1, as a real repeat
  // customer would (a different row, same email/phone).
  const publicId = await createMinimalSubmission(identity, "REPEAT");
  const checkout = await post("/api/checkout-session", { publicId });
  if (!checkout.json?.success) {
    record("Prior-trial customer -> checkout still proceeds (no second trial)", false, checkout.json);
    return;
  }
  const truth = await retrieveSessionTruth(checkout.json.url);
  const priceAud = 297 * 100;
  record(
    "Prior-trial customer -> denied a second trial (amount_total = full price)",
    truth.amount_total === priceAud,
    truth,
  );
  record("Prior-trial customer -> no misleading $0-today message", truth.custom_text_submit === null, { custom_text_submit: truth.custom_text_submit });

  await supabase.from("onboarding_submissions").delete().eq("id", priorRow.id);
  return identity;
}

// ── Case 3: abandoned checkout does not consume eligibility ---------------
async function caseAbandonedCheckoutDoesNotConsume() {
  const identity = randomIdentity();
  const publicId = await createMinimalSubmission(identity, "ABANDON");

  // "Create and abandon" twice — never completed, never touched by the
  // webhook — then check the SAME identity is still eligible.
  await post("/api/checkout-session", { publicId });
  await post("/api/checkout-session", { publicId });

  const { data: rows } = await supabase
    .from("onboarding_submissions")
    .select("trial_starts_at")
    .eq("business_email", identity.email);
  const consumedByAbandonment = rows.some((r) => r.trial_starts_at !== null);
  record("Abandoned/uncompleted Checkout Sessions do not set trial_starts_at", !consumedByAbandonment, { rows });

  const checkout3 = await post("/api/checkout-session", { publicId });
  const truth = await retrieveSessionTruth(checkout3.json.url);
  record("Same identity still gets $0 after 2 abandoned sessions", truth.amount_total === 0, truth);
}

console.log(`Running trial-eligibility regression against ${BASE} (live Stripe key — sessions created, never completed)\n`);

await caseNewCustomer();
console.log();
await casePriorTrialCustomer();
console.log();
await caseAbandonedCheckoutDoesNotConsume();

console.log(`\n--- Fail-closed invariant (createSubscriptionCheckoutSession) ---`);
console.log(
  "Not independently forced here: it guards against Stripe's own session " +
    "disagreeing with our eligibleForTrial=true request, which isn't something " +
    "safely reproducible against live Stripe without an actual misconfiguration. " +
    "Verified by code review: src/lib/stripe/subscriptionCheckout.ts throws " +
    "before returning a URL whenever eligibleForTrial is true but the created " +
    "session's amount_total is not 0 — the two positive cases above (Case 1 " +
    "and Case 3's final check) both exercise the non-throwing path of that " +
    "same check on every run, since a failure there would make this script fail too.",
);

await cleanupRows("%QA-Trial-Invariant%");

const allPass = results.every((r) => r.pass);
console.log(`\n${allPass ? "ALL CASES PASS" : "SOME CASES FAILED"}`);
process.exit(allPass ? 0 : 1);
