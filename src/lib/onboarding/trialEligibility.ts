import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Repeat free-trial protection. A trial is considered previously granted
 * ONLY when a prior onboarding_submissions row reached trial_starts_at IS
 * NOT NULL — set exclusively by the webhook-confirmed
 * processSubscriptionStarted (src/lib/subscriptionFulfillment.ts), never by
 * a submitted form or an opened/abandoned Checkout Session. Cancelling a
 * subscription never clears trial_starts_at, so this remains the correct
 * historical record even after a customer cancels — by design, no
 * cancellation-handling code is needed here.
 *
 * Matches on normalized business email, normalized Australian phone, or ABN
 * (when present) — deliberately never business_name, which is too
 * collision-prone across unrelated businesses to safely deny a real
 * customer their first trial.
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Canonicalizes an Australian phone number to "61" + national significant
 * number, so "0412 345 678", "0412345678" and "+61 412 345 678" all
 * normalize identically regardless of spacing/punctuation/leading 0 vs +61.
 * Falls back to digits-only for anything that doesn't match the expected AU
 * shape (10 digits starting with 0, or 11 starting with 61) so malformed
 * input never throws — it just won't spuriously collide with a real number.
 */
export function normalizeAustralianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length === 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `61${digits.slice(1)}`;
  return digits;
}

function normalizeAbn(abn: string | null): string | null {
  if (!abn) return null;
  const trimmed = abn.replace(/\s+/g, "");
  return trimmed.length > 0 ? trimmed : null;
}

type TrialHistoryRow = {
  business_email: string;
  business_phone: string;
  abn: string | null;
};

// Supabase/PostgREST caps rows per request (project default: 1000) — without
// explicit pagination, a single unpaginated .select() would silently return
// a truncated subset once the historical trial ledger grows past that cap,
// rather than erroring. Paginating in fixed-size pages, ordered by the
// stable primary key, guarantees every qualifying row is seen regardless of
// how large that ledger gets, without depending on the platform's max-rows
// setting or guessing a single large .range() upper bound.
const TRIAL_HISTORY_PAGE_SIZE = 500;

/**
 * Fetches every row that already reached a real, webhook-confirmed trial
 * start, paginating until a page comes back shorter than the page size.
 * failed=true (any page's query erroring) short-circuits the remaining
 * pages immediately — a partial-but-unflagged result would be worse than no
 * result, since callers fail closed on failed=true.
 */
async function fetchAllTrialHistoryRows(): Promise<{ rows: TrialHistoryRow[]; failed: boolean }> {
  const rows: TrialHistoryRow[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabaseServer
      .from("onboarding_submissions")
      .select("business_email, business_phone, abn")
      .not("trial_starts_at", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + TRIAL_HISTORY_PAGE_SIZE - 1);

    if (error) {
      console.error("Failed to fetch a page of prior trial history:", error.message);
      return { rows, failed: true };
    }

    const page = (data ?? []) as TrialHistoryRow[];
    rows.push(...page);

    if (page.length < TRIAL_HISTORY_PAGE_SIZE) break;
    offset += TRIAL_HISTORY_PAGE_SIZE;
  }

  return { rows, failed: false };
}

export type PriorTrialCheck = {
  hasPrior: boolean;
  /** Which identifier matched, for diagnostic logging only — never exposed to the client. */
  matchedOn: "email" | "phone" | "abn" | "lookup-failed" | null;
};

/**
 * Phone normalization can't be pushed into a plain equality filter (raw
 * formats vary), so matching stays in application code rather than adding a
 * Postgres function or duplicate normalized columns purely to index it.
 *
 * Returns which identifier matched (not just a boolean) so callers can log
 * *why* a customer was denied a trial — this is the detail that let a real
 * "customer sees $297 due today" report be conclusively traced back to a
 * genuine prior trial on that exact email, rather than left as a guess.
 */
export async function checkPriorTrial({
  businessEmail,
  businessPhone,
  abn,
}: {
  businessEmail: string;
  businessPhone: string;
  abn: string | null;
}): Promise<PriorTrialCheck> {
  const targetEmail = normalizeEmail(businessEmail);
  const targetPhone = normalizeAustralianPhone(businessPhone);
  const targetAbn = normalizeAbn(abn);

  const { rows, failed } = await fetchAllTrialHistoryRows();

  if (failed) {
    // Fail closed: if eligibility can't be fully verified, don't risk
    // granting a second trial. A wrongly-denied customer can still
    // subscribe (see /api/checkout-session) — they just skip the trial —
    // so this is the safer failure direction, not a hard lockout.
    return { hasPrior: true, matchedOn: "lookup-failed" };
  }

  for (const row of rows) {
    if (normalizeEmail(row.business_email) === targetEmail) return { hasPrior: true, matchedOn: "email" };
    if (normalizeAustralianPhone(row.business_phone) === targetPhone) return { hasPrior: true, matchedOn: "phone" };
    if (targetAbn && normalizeAbn(row.abn) === targetAbn) return { hasPrior: true, matchedOn: "abn" };
  }

  return { hasPrior: false, matchedOn: null };
}

/** Boolean-only convenience wrapper, kept for call sites that don't need the match reason. */
export async function hasPriorTrial(args: {
  businessEmail: string;
  businessPhone: string;
  abn: string | null;
}): Promise<boolean> {
  return (await checkPriorTrial(args)).hasPrior;
}
