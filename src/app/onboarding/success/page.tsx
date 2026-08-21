import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, PartyPopper, Check } from "lucide-react";
import { MANAGE_BILLING_HREF } from "@/lib/routes";
import { siteConfig } from "@/config/site";
import { resolveSubmissionFromSessionId } from "@/lib/stripe/resolveOnboardingSession";
import { SuccessAndSetupFlow } from "@/components/onboarding/SuccessAndSetupFlow";

const NEXT_STEPS = [
  "We configure your Velxo system",
  "Your login details are sent by email and SMS",
  "Download LeadConnector and sign in",
  "Start using your Jobs Pipeline",
];

export const metadata: Metadata = {
  title: "Trial Signup Received — Velxo",
  robots: { index: false, follow: false },
};

/**
 * Stripe's success_url. A browser redirect here is NOT proof the trial
 * actually started (the payment could still fail downstream, e.g. an async
 * payment method) — the signed Stripe webhook remains the only authoritative
 * source for that. This page never writes to Supabase or HighLevel; it only
 * READS (via resolveSubmissionFromSessionId, which itself confirms the
 * Stripe session status is "complete" before trusting anything) to decide
 * which of three read-only views to render — refreshing this page can never
 * duplicate or corrupt anything.
 *
 * Three branches:
 *  - session unresolvable (missing/invalid id, or genuinely not completed)
 *    → generic fallback confirmation, since payment may still have
 *      succeeded and this page must never hard-fail a post-payment visit
 *  - resolved, setup not yet complete → the merged trial-confirmation +
 *    Finish Setup experience (SuccessAndSetupFlow) — no separate click
 *    required to move from "trial started" into setup
 *  - resolved, setup already complete → the full completion view (video,
 *    next steps, billing) — also what a returning/refreshing visitor sees
 */
export default async function OnboardingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const submission = sessionId ? await resolveSubmissionFromSessionId(sessionId) : null;

  if (submission && !submission.setup_completed_at) {
    return (
      <div className="relative flex min-h-screen flex-col bg-zinc-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden"
        >
          <div className="h-[420px] w-[720px] rounded-full bg-gradient-to-br from-emerald-500/15 via-violet-600/10 to-transparent opacity-80 blur-3xl" />
        </div>

        <header className="flex h-16 items-center border-b border-white/10 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-white">
              <Wrench className="h-3.5 w-3.5" />
            </span>
            {siteConfig.name}
          </Link>
        </header>

        <SuccessAndSetupFlow
          sessionId={sessionId as string}
          plan={submission.plan ?? "ai_receptionist"}
          businessName={submission.business_name}
          businessPhone={submission.business_phone}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-zinc-950 px-4 py-14 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[420px] w-[720px] rounded-full bg-gradient-to-br from-emerald-500/15 via-violet-600/10 to-transparent opacity-80 blur-3xl" />
      </div>

      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <PartyPopper className="h-7 w-7" />
      </span>
      <h1 className="mt-4 max-w-md text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
        Your Velxo trial has started.
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/55">
        Your system is being prepared. Watch this quick setup video while we activate your account.
      </p>

      <div className="mt-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40">
        <video className="aspect-video w-full" controls preload="metadata" playsInline>
          <source src="/videos/velxo-onboarding.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="mt-10 w-full max-w-md text-left">
        <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">What happens next?</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {NEXT_STEPS.map((item, i) => (
            <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-white/80">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={4} />
              </span>
              <span>
                Step {i + 1} — {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/55">
        You don&apos;t need to configure anything yourself. We&apos;ll send your login details once your system is
        activated.
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/35">
        Most Velxo accounts are fully prepared within one business day. Our onboarding team will contact you if we
        need anything else.
      </p>

      {sessionId && <p className="mt-4 text-xs text-white/30">Reference: {sessionId}</p>}
      <Link
        href="/"
        className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
      >
        Back to Velxo
      </Link>

      {MANAGE_BILLING_HREF && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <a
            href={MANAGE_BILLING_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-white/55 underline decoration-white/20 underline-offset-4 hover:text-white/85"
          >
            Manage Billing / Cancel Subscription
          </a>
          <p className="mt-1.5 text-xs text-white/35">
            You can view invoices, update your payment method, or cancel before your trial ends and pay
            nothing.
          </p>
        </div>
      )}
    </div>
  );
}
