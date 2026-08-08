import type { Metadata } from "next";
import Link from "next/link";
import { PartyPopper, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/plans";
import { getPlanForCheckoutSession } from "@/lib/stripe/subscriptionCheckout";

const SUCCESS_COPY: Record<
  Plan,
  { subheading: string; steps: string[]; setupNote: string }
> = {
  ai_receptionist: {
    subheading: "Your AI Receptionist is now being prepared.",
    steps: [
      "Creating your workspace",
      "Configuring your AI Receptionist",
      "Provisioning your business phone number",
      "Connecting your account",
    ],
    setupNote:
      "Most Velxo accounts are fully prepared within one business day. Our onboarding team will contact you if we need anything else.",
  },
  complete: {
    subheading: "Your Complete Business System is now being prepared.",
    steps: [
      "Creating your workspace",
      "Configuring your AI Receptionist",
      "Provisioning your business phone number",
      "Preparing your website and automation system",
      "Connecting your account",
    ],
    setupNote:
      "Most Velxo accounts are fully prepared within one business day. Our onboarding team will contact you if we need anything else.",
  },
};

const DEFAULT_PLAN: Plan = "ai_receptionist";

export const metadata: Metadata = {
  title: "Trial Signup Received — Velxo",
  robots: { index: false, follow: false },
};

/**
 * Stripe's success_url — reached purely from a browser redirect, which is
 * NOT proof the trial actually started (the payment could still fail
 * downstream, e.g. an async payment method). The signed Stripe webhook
 * (Phase 2) is the only authoritative source for that — this page
 * deliberately makes no Supabase or HighLevel writes, and the Checkout
 * Session id below is shown only as a human-readable reference, not used to
 * look up or assert any status.
 *
 * The plan shown here comes from Stripe's own session metadata (set at
 * Checkout Session creation time, see subscriptionCheckout.ts), retrieved
 * server-side by session_id — never from a client-editable query param, and
 * never from onboarding_submissions, which the webhook only populates
 * asynchronously and may not have written yet when this redirect happens.
 * Falls back to the AI Receptionist copy if the session can't be resolved
 * (e.g. Stripe hiccup) — cosmetic only, no functional impact.
 */
export default async function OnboardingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const plan = (sessionId ? await getPlanForCheckoutSession(sessionId) : null) ?? DEFAULT_PLAN;
  const copy = SUCCESS_COPY[plan];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <PartyPopper className="h-7 w-7" />
      </span>
      <h1 className="max-w-md text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        Welcome to Velxo.
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-zinc-500">{copy.subheading}</p>

      <ul className="mt-2 flex flex-col gap-2 text-left">
        {copy.steps.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-zinc-700">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <Check className="h-2.5 w-2.5" strokeWidth={4} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-zinc-500">
        We&apos;ll email you as soon as everything is ready.
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-zinc-400">{copy.setupNote}</p>

      {sessionId && (
        <p className="mt-2 text-xs text-zinc-400">Reference: {sessionId}</p>
      )}
      <Link href="/" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-2")}>
        Back to Velxo
      </Link>
    </div>
  );
}
