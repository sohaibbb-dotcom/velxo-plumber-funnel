"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ONBOARDING_PUBLIC_ID_STORAGE_KEY } from "@/components/onboarding/OnboardingFlow";

// sessionStorage never changes from outside this tab in a way this page
// needs to react to, so subscribe is a no-op — this is purely a one-time,
// SSR-safe read via useSyncExternalStore's getServerSnapshot/getSnapshot
// split (same pattern already used elsewhere in this app for other
// browser-only reads), not a real subscription.
function subscribeNoop() {
  return () => {};
}

function getPublicIdSnapshot(): string | null {
  try {
    return window.sessionStorage.getItem(ONBOARDING_PUBLIC_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Reads the publicId Phase 1 stashed in sessionStorage before redirecting to
 * Stripe (see OnboardingFlow) and, if present, offers a retry that mints a
 * fresh Checkout Session for the SAME row via the existing, unchanged
 * /api/checkout-session route — never a second onboarding_submissions
 * insert. cancel_url itself carries no params (must stay unchanged), so this
 * is the only way to thread the row's identity across the Stripe redirect.
 * Falls back to the generic "Back to Pricing" CTA when storage is empty
 * (different device/browser, cleared storage, or direct navigation here).
 */
export function CancelledRetry() {
  const publicId = useSyncExternalStore(subscribeNoop, getPublicIdSnapshot, getServerSnapshot);
  const [status, setStatus] = useState<"idle" | "retrying" | "error">("idle");

  const handleRetry = async () => {
    if (!publicId || status === "retrying") return;
    setStatus("retrying");

    try {
      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success || typeof payload.url !== "string") {
        setStatus("error");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setStatus("error");
    }
  };

  if (!publicId) {
    return (
      <Link
        href="/#pricing"
        className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500"
      >
        Back to Pricing
      </Link>
    );
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleRetry}
        disabled={status === "retrying"}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-violet-950/30 transition-all duration-200 hover:from-violet-500 hover:to-blue-500 disabled:opacity-70"
      >
        {status === "retrying" && <Loader2 className="h-4 w-4 animate-spin" />}
        Return to Checkout
      </button>
      {status === "error" && (
        <p className="max-w-xs text-center text-xs text-red-400/90">
          We couldn&apos;t restart checkout. Please try again, or head back to pricing.
        </p>
      )}
      <Link href="/#pricing" className="text-xs text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white/70">
        Back to Pricing
      </Link>
    </div>
  );
}
