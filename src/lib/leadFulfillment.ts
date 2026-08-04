import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { upsertContact, moveOpportunityToStage, type OpportunityStageName } from "@/lib/highlevel";
import type { OnboardingSubmissionRow } from "@/lib/onboarding/types";

/**
 * Progressive GHL pipeline stages driven from lead-capture time onward —
 * distinct from src/lib/depositFulfillment.ts, which owns only the
 * Stripe-triggered "Deposit Paid" transition. Every path here funnels
 * through the same forward-only moveOpportunityToStage() guard in
 * src/lib/highlevel.ts, so no call order can create a duplicate
 * opportunity or move one backwards.
 */

function contactInputFrom(
  submission: Pick<OnboardingSubmissionRow, "business_email" | "business_phone" | "owner_name" | "business_name">,
) {
  const nameParts = submission.owner_name.trim().split(/\s+/);
  return {
    email: submission.business_email,
    phone: submission.business_phone,
    firstName: nameParts[0] ?? submission.owner_name,
    lastName: nameParts.slice(1).join(" "),
    businessName: submission.business_name,
  };
}

/**
 * The onboarding wizard is normally reached via a CTA on an already-viewed
 * preview, so by the time a submission lands, the preview has usually
 * already been seen. Correlated by email — preview_requests and
 * onboarding_submissions are separate tables with no shared id today.
 */
async function wasPreviewAlreadyViewed(email: string): Promise<boolean> {
  const { data, error } = await supabaseServer
    .from("preview_requests")
    .select("preview_viewed_at")
    .eq("email", email)
    .not("preview_viewed_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check preview_requests for a prior view:", error.message);
    return false;
  }
  return Boolean(data);
}

/**
 * Fires once, right after a new onboarding_submissions row is inserted.
 * Creates the HighLevel contact/opportunity at "New Lead" — or straight at
 * "Preview Viewed" if this business already viewed its preview earlier —
 * and saves the resulting ids back onto the row.
 *
 * Deliberately swallows its own errors: HighLevel being slow or down must
 * never fail the customer-facing onboarding submission, which has already
 * succeeded in Supabase by the time this runs.
 */
export async function pushNewLeadToHighLevel(submission: OnboardingSubmissionRow): Promise<void> {
  try {
    const alreadyViewed = await wasPreviewAlreadyViewed(submission.business_email);
    const targetStageName: OpportunityStageName = alreadyViewed ? "Preview Viewed" : "New Lead";

    const { contactId } = await upsertContact(contactInputFrom(submission));
    const { opportunityId } = await moveOpportunityToStage({
      contactId,
      targetStageName,
      name: `${submission.business_name} — ${targetStageName}`,
    });

    const { error } = await supabaseServer
      .from("onboarding_submissions")
      .update({ ghl_contact_id: contactId, ghl_opportunity_id: opportunityId })
      .eq("id", submission.id);

    if (error) {
      console.error(
        `Pushed submission ${submission.id} to HighLevel, but saving ghl ids to Supabase failed:`,
        error.message,
      );
    }
  } catch (err) {
    console.error(
      `Failed to push onboarding submission ${submission.id} to HighLevel:`,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Fires on every view of a generated preview (src/app/p/[publicId]/route.ts).
 * Advances the matching business's opportunity to "Preview Viewed" if one
 * already exists. A no-op when the customer hasn't submitted the onboarding
 * form yet — the common case, since viewing happens before onboarding —
 * because pushNewLeadToHighLevel() checks for a prior view and starts at
 * "Preview Viewed" directly once they do submit.
 */
export async function advancePreviewViewedByEmail(email: string): Promise<void> {
  try {
    const { data: submission, error } = await supabaseServer
      .from("onboarding_submissions")
      .select("id, business_name, ghl_contact_id, ghl_opportunity_id")
      .eq("business_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to look up onboarding_submissions for a preview-viewed advance:", error.message);
      return;
    }
    if (!submission?.ghl_contact_id) return;

    const { opportunityId } = await moveOpportunityToStage({
      contactId: submission.ghl_contact_id,
      targetStageName: "Preview Viewed",
      name: `${submission.business_name} — Preview Viewed`,
    });

    if (opportunityId !== submission.ghl_opportunity_id) {
      const { error: updateError } = await supabaseServer
        .from("onboarding_submissions")
        .update({ ghl_opportunity_id: opportunityId })
        .eq("id", submission.id);
      if (updateError) {
        console.error(
          `Advanced the opportunity for submission ${submission.id}, but saving the id to Supabase failed:`,
          updateError.message,
        );
      }
    }
  } catch (err) {
    console.error(`Failed to advance the preview-viewed stage for email ${email}:`, err instanceof Error ? err.message : err);
  }
}
