import type { Metadata } from "next";
import Link from "next/link";
import { PartyPopper, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MANAGE_BILLING_HREF } from "@/lib/routes";

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
 * Stripe's success_url — reached purely from a browser redirect, which is
 * NOT proof the trial actually started (the payment could still fail
 * downstream, e.g. an async payment method). The signed Stripe webhook is
 * the only authoritative source for that — this page deliberately makes no
 * Supabase or HighLevel writes, and the Checkout Session id below is shown
 * only as a human-readable reference, never used to look up or assert any
 * status. No plan-specific copy here (both plans share identical activation
 * messaging), so this page no longer needs to resolve which plan a session
 * was for.
 */
export default async function OnboardingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <PartyPopper className="h-7 w-7" />
      </span>
      <h1 className="mt-4 max-w-md text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        Your Velxo trial has started.
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-zinc-500">
        Your system is being prepared. Watch this quick setup video while we activate your account.
      </p>

      <div className="mt-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]">
        <video className="aspect-video w-full" controls preload="metadata" playsInline>
          <source src="/videos/velxo-onboarding.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="mt-10 w-full max-w-md text-left">
        <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">What happens next?</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {NEXT_STEPS.map((item, i) => (
            <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-zinc-700">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={4} />
              </span>
              <span>
                Step {i + 1} — {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-zinc-500">
        You don&apos;t need to configure anything yourself. We&apos;ll send your login details once your system is
        activated.
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
        Most Velxo accounts are fully prepared within one business day. Our onboarding team will contact you if we
        need anything else.
      </p>

      {sessionId && <p className="mt-4 text-xs text-zinc-400">Reference: {sessionId}</p>}
      <Link href="/" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-4")}>
        Back to Velxo
      </Link>

      {MANAGE_BILLING_HREF && (
        <div className="mt-8 border-t border-zinc-100 pt-6">
          <a
            href={MANAGE_BILLING_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-700"
          >
            Manage Billing / Cancel Subscription
          </a>
          <p className="mt-1.5 text-xs text-zinc-400">
            You can view invoices, update your payment method, or cancel any time before your trial ends — no charge
            if you cancel during the free trial.
          </p>
        </div>
      )}
    </div>
  );
}
