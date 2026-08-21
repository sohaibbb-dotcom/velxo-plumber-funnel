import "server-only";
import { NextResponse, after } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveSubmissionFromSessionId } from "@/lib/stripe/resolveOnboardingSession";
import { validatePhase2Fields, type Phase2RequestBody } from "@/lib/onboarding/validation";
import { triggerProvisioningIfReady } from "@/lib/onboarding/provisioning";

/**
 * Phase 2 ("Finish Setup") of the two-phase onboarding funnel — updates the
 * SAME onboarding_submissions row Phase 1 created (never a second row) with
 * business verification, AI setup, and (Complete plan) website setup
 * fields, once the customer has already started their Stripe trial.
 *
 * Same-origin only — called by the success/setup experience
 * (src/app/onboarding/success/page.tsx), not by the legacy cross-origin
 * onboarding.html, so no CORS handling is needed here.
 *
 * Deliberately never accepts a client-supplied public_id: the ONLY way this
 * route resolves which row to write is via the Stripe Checkout Session id
 * (see resolveSubmissionFromSessionId) — the same credential the customer's
 * own browser received from Stripe's post-payment redirect. This is what
 * stops one customer from ever being able to edit another's submission.
 */

const GENERIC_ERROR = "We couldn't save your setup. Please try again.";

type RequestBody = Phase2RequestBody & { sessionId?: unknown };

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Missing checkout reference." }, { status: 400 });
  }

  const submission = await resolveSubmissionFromSessionId(sessionId);
  if (!submission) {
    return NextResponse.json(
      { success: false, error: "We couldn't find that trial. Please use the link from your confirmation email." },
      { status: 404 },
    );
  }

  const validated = validatePhase2Fields(body);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
  }
  const f = validated.fields;

  // First completion wins — a refresh or duplicate submit after setup is
  // already complete is treated as a success (idempotent), not re-validated
  // or re-written, so it can never race the provisioning gate below with a
  // second "first" completion.
  const alreadyComplete = submission.setup_completed_at !== null;

  if (!alreadyComplete) {
    const { error: updateError } = await supabaseServer
      .from("onboarding_submissions")
      .update({
        abn: f.abn,
        business_address: f.businessAddress,
        trading_name: f.tradingName,
        existing_website: f.existingWebsite,
        notification_mobile: f.notificationMobile,
        suburbs_covered: f.suburbsCovered,
        opening_hours: f.openingHours,
        use_existing_number: f.useExistingNumber,
        number_porting_notes: f.numberPortingNotes,
        services: f.services,
        colour_scheme: f.colourScheme,
        google_link: f.googleLink,
        notes: f.notes,
        referral_source: f.referralSource,
        logo_path: f.logoPath,
        website_photo_paths: f.websitePhotoPaths,
        website_notes: f.websiteNotes,
        verification_document_type: f.verificationDocumentType,
        verification_document_path: f.verificationDocumentPath,
        verification_document_other_description: f.verificationDocumentOtherDescription,
        address_verification_document_type: f.addressVerificationDocumentType,
        address_verification_document_path: f.addressVerificationDocumentPath,
        setup_completed_at: new Date().toISOString(),
      })
      .eq("id", submission.id)
      .is("setup_completed_at", null);

    if (updateError) {
      console.error(`Failed to save Finish Setup fields for submission ${submission.id}:`, updateError.message);
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 });
    }
  }

  // Never blocks the customer-facing response on HighLevel — same pattern
  // as reuseForOnboarding. The customer's setup is already durably saved by
  // this point regardless of how this resolves.
  after(() =>
    triggerProvisioningIfReady(submission.id).catch((err) => {
      console.error(`Provisioning trigger failed for submission ${submission.id}:`, err instanceof Error ? err.message : err);
    }),
  );

  return NextResponse.json({ success: true });
}
