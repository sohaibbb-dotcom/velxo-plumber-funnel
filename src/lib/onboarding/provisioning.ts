import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { upsertContact, moveOpportunityToStage, AGENCY_PIPELINE_NAME } from "@/lib/highlevel";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";

/**
 * The provisioning-safety gate. Pushing a contact into "New Trial" (the
 * agency's internal ops pipeline — src/lib/highlevel.ts's AGENCY_PIPELINE_NAME)
 * triggers an already-built, external HighLevel workflow (internal
 * notification + phone/SMS provisioning task) that this codebase never
 * touches directly. That push must fire once — not before the customer has
 * both started their Stripe trial AND completed the post-checkout "Finish
 * Setup" step (business verification + AI setup), and never more than once.
 *
 * This function is called from two genuinely independent, non-serialized
 * places — the Stripe webhook (src/lib/subscriptionFulfillment.ts, once
 * trial_starts_at is persisted) and /api/onboarding-setup (once
 * setup_completed_at is persisted) — whichever runs second is the one that
 * actually fires the HighLevel push. Race-safety therefore can't rely on
 * read-then-act in application code (two concurrent callers could both read
 * "ready" before either writes anything); it relies on ONE atomic
 * conditional UPDATE claiming the row first. Postgres guarantees at most one
 * concurrent UPDATE with this WHERE clause ever returns a row, so at most
 * one caller ever proceeds to call HighLevel — the same guarantee
 * acquireEventLock's insert-first-unique-violation pattern relies on in
 * depositFulfillment.ts, just expressed as a conditional UPDATE instead of
 * an INSERT (there's no natural unique key to violate here).
 */
export async function triggerProvisioningIfReady(submissionId: string): Promise<void> {
  const claimedAt = new Date().toISOString();

  const { data: claimed, error: claimError } = await supabaseServer
    .from("onboarding_submissions")
    .update({ provisioning_triggered_at: claimedAt })
    .eq("id", submissionId)
    .not("trial_starts_at", "is", null)
    .not("setup_completed_at", "is", null)
    .is("provisioning_triggered_at", null)
    .select("*")
    .maybeSingle();

  if (claimError) {
    console.error(`Failed to claim provisioning gate for submission ${submissionId}:`, claimError.message);
    throw new Error(`Could not claim provisioning gate for submission ${submissionId}`);
  }

  // No row returned: either not ready yet (trial not started, or setup not
  // complete) or another caller already claimed/fired this — either way, a
  // correct no-op.
  if (!claimed) return;

  const submission = claimed as OnboardingSubmissionRow;

  try {
    let contactId = submission.ghl_contact_id;
    if (!contactId) {
      // Covers the case where the webhook's own ghl_contact_id bookkeeping
      // write failed earlier — upsertContact is idempotent by email/phone,
      // so re-calling it here is always safe.
      const upserted = await upsertContact({
        email: submission.business_email,
        phone: submission.business_phone,
        firstName: submission.owner_name.trim().split(/\s+/)[0] ?? submission.owner_name,
        lastName: submission.owner_name.trim().split(/\s+/).slice(1).join(" "),
        businessName: submission.business_name,
      });
      contactId = upserted.contactId;
    }

    await moveOpportunityToStage({
      contactId,
      targetStageName: "New Trial",
      name: submission.business_name,
      pipelineName: AGENCY_PIPELINE_NAME,
    });

    if (!submission.ghl_contact_id) {
      const { error: linkError } = await supabaseServer
        .from("onboarding_submissions")
        .update({ ghl_contact_id: contactId })
        .eq("id", submissionId);
      if (linkError) {
        console.error(
          `Provisioning triggered for submission ${submissionId}, but recording ghl_contact_id failed:`,
          linkError.message,
        );
      }
    }
  } catch (err) {
    // Compensate: release the claim so a later call (webhook retry, or a
    // fresh Finish Setup completion) can retry. Guarded by the exact
    // timestamp we set, so a legitimate concurrent success can never be
    // clobbered by this rollback.
    const { error: releaseError } = await supabaseServer
      .from("onboarding_submissions")
      .update({ provisioning_triggered_at: null })
      .eq("id", submissionId)
      .eq("provisioning_triggered_at", claimedAt);
    if (releaseError) {
      console.error(
        `Failed to release provisioning claim for submission ${submissionId} after a processing error:`,
        releaseError.message,
      );
    }
    console.error(
      `Failed to trigger provisioning for submission ${submissionId}:`,
      err instanceof Error ? err.message : err,
    );
    throw err;
  }
}
