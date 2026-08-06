import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { upsertContact, moveOpportunityToStage } from "@/lib/highlevel";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";
import type { PreviewRequestRow } from "@/lib/preview/types";

/**
 * Progressive GHL pipeline stages, driven from the top of the funnel
 * onward — distinct from src/lib/depositFulfillment.ts, which owns only
 * the Stripe-triggered "Deposit Paid" transition. Every path here funnels
 * through the same forward-only moveOpportunityToStage() guard in
 * src/lib/highlevel.ts, so no call order can create a duplicate
 * opportunity or move one backwards.
 *
 * The preview_requests row is now the SOURCE OF TRUTH for a contact's
 * ghl_contact_id/ghl_opportunity_id — it's created and saved here, the
 * moment the /preview form is submitted, at "New Lead". Everything
 * downstream (viewing the preview, submitting the onboarding wizard,
 * paying the deposit) reuses that same contact/opportunity rather than
 * guessing via cross-table correlation.
 */

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? fullName, lastName: parts.slice(1).join(" ") };
}

/**
 * Fires once, right after a new preview_requests row is inserted (the
 * top-of-funnel /preview form). Creates the HighLevel contact and an
 * opportunity at "New Lead", and saves the resulting ids back onto the
 * row. Deliberately swallows its own errors: HighLevel being slow or down
 * must never fail the customer-facing preview submission.
 */
export async function pushPreviewLeadToHighLevel(previewRow: PreviewRequestRow): Promise<void> {
  try {
    const { firstName, lastName } = splitName(previewRow.contact_name || previewRow.business_name);

    const { contactId } = await upsertContact({
      email: previewRow.email,
      phone: previewRow.phone,
      firstName,
      lastName,
      businessName: previewRow.business_name,
    });

    const { opportunityId } = await moveOpportunityToStage({
      contactId,
      targetStageName: "New Lead",
      name: previewRow.business_name,
    });

    const { error } = await supabaseServer
      .from("preview_requests")
      .update({ ghl_contact_id: contactId, ghl_opportunity_id: opportunityId })
      .eq("id", previewRow.id);

    if (error) {
      console.error(
        `Pushed preview request ${previewRow.id} to HighLevel, but saving ghl ids to Supabase failed:`,
        error.message,
      );
    }
  } catch (err) {
    console.error(
      `Failed to push preview request ${previewRow.id} to HighLevel:`,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Fires on every view of a generated preview (src/app/p/[publicId]/route.ts).
 * Advances that SAME opportunity to "Preview Viewed" using the ids already
 * saved on the row. Falls back to a full upsert (as a safety net, in case
 * the original "New Lead" push failed or this row predates that column
 * existing) so a view never leaves a lead stranded with no HighLevel
 * record at all.
 */
export async function advancePreviewViewedById(previewRow: PreviewRequestRow): Promise<void> {
  try {
    let contactId = previewRow.ghl_contact_id;

    if (!contactId) {
      const { firstName, lastName } = splitName(previewRow.contact_name || previewRow.business_name);
      const upserted = await upsertContact({
        email: previewRow.email,
        phone: previewRow.phone,
        firstName,
        lastName,
        businessName: previewRow.business_name,
      });
      contactId = upserted.contactId;
    }

    const { opportunityId } = await moveOpportunityToStage({
      contactId,
      targetStageName: "Preview Viewed",
      name: previewRow.business_name,
    });

    if (contactId !== previewRow.ghl_contact_id || opportunityId !== previewRow.ghl_opportunity_id) {
      const { error } = await supabaseServer
        .from("preview_requests")
        .update({ ghl_contact_id: contactId, ghl_opportunity_id: opportunityId })
        .eq("id", previewRow.id);
      if (error) {
        console.error(
          `Advanced the opportunity for preview request ${previewRow.id}, but saving ghl ids to Supabase failed:`,
          error.message,
        );
      }
    }
  } catch (err) {
    console.error(
      `Failed to advance preview-viewed stage for preview request ${previewRow.id}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Fires once, right after a new onboarding_submissions row is inserted.
 * Reuses the existing HighLevel contact/opportunity for this email (the
 * one created by the /preview funnel above) rather than creating a new
 * one: upsertContact is idempotent by email, and moveOpportunityToStage
 * finds any existing opportunity for that contact — so this can only ever
 * attach to what's already there. Passing "New Lead" as the target is
 * deliberate: it's the lowest stage in the funnel, so the forward-only
 * guard in moveOpportunityToStage means this call can never regress
 * whatever stage the opportunity is actually at (Preview Viewed or
 * beyond) — it only creates fresh at "New Lead" for the rare case where
 * onboarding was reached without ever going through /preview.
 */
export async function reuseForOnboarding(submission: OnboardingSubmissionRow): Promise<void> {
  try {
    const { firstName, lastName } = splitName(submission.owner_name);

    const { contactId } = await upsertContact({
      email: submission.business_email,
      phone: submission.business_phone,
      firstName,
      lastName,
      businessName: submission.business_name,
    });

    const { opportunityId } = await moveOpportunityToStage({
      contactId,
      targetStageName: "New Lead",
      name: submission.business_name,
    });

    const { error } = await supabaseServer
      .from("onboarding_submissions")
      .update({ ghl_contact_id: contactId, ghl_opportunity_id: opportunityId })
      .eq("id", submission.id);

    if (error) {
      console.error(
        `Reused HighLevel contact/opportunity for submission ${submission.id}, but saving ids to Supabase failed:`,
        error.message,
      );
    }
  } catch (err) {
    console.error(
      `Failed to reuse HighLevel contact/opportunity for submission ${submission.id}:`,
      err instanceof Error ? err.message : err,
    );
  }
}
