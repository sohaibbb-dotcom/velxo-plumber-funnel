"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, Loader2, MapPin, Star } from "lucide-react";
import type { GooglePlaceCandidate } from "@/lib/google/types";
import type { OnboardingFormData } from "@/components/onboarding/types";

/**
 * Replaces manual "paste your Google review link" entry with an automatic
 * lookup using the business name/address already collected in the Business
 * step. Deliberately never blocks onboarding: every non-"confirmed" state
 * still lets the customer continue via "Skip for now" (see AiSetupStep,
 * which no longer marks anything here as a required field).
 */

async function searchBusiness(query: string): Promise<{ candidates: GooglePlaceCandidate[] } | { error: true }> {
  try {
    const res = await fetch("/api/places/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) return { error: true };
    return { candidates: Array.isArray(payload.candidates) ? payload.candidates : [] };
  } catch {
    return { error: true };
  }
}

async function fetchReviewLink(placeId: string): Promise<{ reviewLink: string | null } | { error: true }> {
  try {
    const res = await fetch("/api/places/review-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) return { error: true };
    return { reviewLink: typeof payload.reviewLink === "string" ? payload.reviewLink : null };
  } catch {
    return { error: true };
  }
}

function buildDefaultQuery(formData: OnboardingFormData): string {
  const name = formData.tradingName.trim() || formData.businessName.trim();
  return [name, formData.businessAddress.trim()].filter(Boolean).join(", ");
}

export function GoogleBusinessProfileConnect({
  formData,
  setFormData,
}: {
  formData: OnboardingFormData;
  setFormData: (updater: (prev: OnboardingFormData) => OnboardingFormData) => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState(() => formData.googleSearchQuery || buildDefaultQuery(formData));

  const status = formData.googleReviewStatus;

  const runSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setFormData((prev) => ({ ...prev, googleReviewStatus: "searching", googleSearchQuery: trimmed }));
    const result = await searchBusiness(trimmed);

    setFormData((prev) => ({
      ...prev,
      googleReviewStatus: "error" in result ? "error" : result.candidates.length > 0 ? "results" : "not_found",
      googleCandidates: "error" in result ? [] : result.candidates,
    }));
  };

  useEffect(() => {
    if (status === "idle" && queryInput.trim()) {
      runSearch(queryInput);
    }
    // Auto-search once on arrival only — every subsequent search is
    // explicitly user-triggered (refine field or a candidate pick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmCandidate = async (candidate: GooglePlaceCandidate) => {
    setConfirmingId(candidate.placeId);
    const result = await fetchReviewLink(candidate.placeId);
    setConfirmingId(null);

    setFormData((prev) => ({
      ...prev,
      // Confirmed WHICH business regardless of whether Google exposed a
      // review link for it — never fabricate one if it didn't.
      googleLink: "error" in result || !result.reviewLink ? "" : result.reviewLink,
      googlePlaceId: candidate.placeId,
      googleReviewStatus: "confirmed",
    }));
  };

  const resetToSearch = () => {
    setFormData((prev) => ({
      ...prev,
      googleReviewStatus: "idle",
      googleCandidates: [],
      googlePlaceId: null,
      googleLink: "",
    }));
  };

  const skip = () => {
    setFormData((prev) => ({
      ...prev,
      googleReviewStatus: "skipped",
      googleCandidates: [],
      googlePlaceId: null,
      googleLink: "",
    }));
  };

  const confirmedCandidate = formData.googleCandidates.find((c) => c.placeId === formData.googlePlaceId);

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-white/75">Connect your Google Business Profile</span>
        <p className="text-xs text-white/40">
          We use this to automatically ask your customers for a Google review — no need to find or paste a link
          yourself.
        </p>
      </div>

      {(status === "idle" || status === "searching") && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-xs text-white/50">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/40" />
          Looking up your Google Business Profile…
        </div>
      )}

      <AnimatePresence initial={false}>
        {status === "results" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2.5"
          >
            <p className="text-xs font-medium text-white/60">
              {formData.googleCandidates.length === 1
                ? "We found your business"
                : "We found a few matches — which one is yours?"}
            </p>
            {formData.googleCandidates.map((candidate) => (
              <button
                key={candidate.placeId}
                type="button"
                disabled={confirmingId !== null}
                onClick={() => confirmCandidate(candidate)}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition-colors hover:border-violet-400/40 hover:bg-white/[0.05] disabled:opacity-60"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">{candidate.name}</span>
                  {candidate.formattedAddress && (
                    <span className="flex items-center gap-1 text-xs text-white/50">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {candidate.formattedAddress}
                    </span>
                  )}
                  {typeof candidate.rating === "number" && (
                    <span className="flex items-center gap-1 text-xs text-white/50">
                      <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                      {candidate.rating.toFixed(1)}
                      {typeof candidate.userRatingCount === "number" && ` (${candidate.userRatingCount})`}
                    </span>
                  )}
                </div>
                {confirmingId === candidate.placeId ? (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-violet-400" />
                ) : (
                  <span className="mt-0.5 shrink-0 text-xs font-semibold text-nowrap text-violet-300">
                    Yes, this is my business
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {status === "confirmed" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-white/75">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              {confirmedCandidate ? `Connected — ${confirmedCandidate.name}` : "Connected"}
            </span>
            <button
              type="button"
              onClick={resetToSearch}
              className="shrink-0 text-xs font-medium text-white/40 underline decoration-white/15 underline-offset-2 hover:text-white/70"
            >
              That&apos;s not my business
            </button>
          </motion.div>
        )}

        {(status === "not_found" || status === "error") && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-xs leading-relaxed text-white/50"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
            <span>
              {status === "not_found"
                ? "We couldn't automatically find your Google Business Profile."
                : "Something went wrong looking up your Google Business Profile."}{" "}
              No problem — this won&apos;t affect your trial. We&apos;ll help connect it during setup.
            </span>
          </motion.div>
        )}

        {status === "skipped" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-xs leading-relaxed text-white/50"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
            We&apos;ll help connect your Google Business Profile during setup.
          </motion.div>
        )}
      </AnimatePresence>

      {status !== "confirmed" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runSearch(queryInput);
                }
              }}
              placeholder="Business name, suburb"
              className="h-9 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20"
            />
            <button
              type="button"
              disabled={status === "searching" || !queryInput.trim()}
              onClick={() => runSearch(queryInput)}
              className="h-9 shrink-0 rounded-lg border border-white/10 px-3 text-xs font-medium text-white/60 transition-colors hover:border-violet-400/40 hover:bg-white/[0.05] disabled:opacity-50"
            >
              Search
            </button>
          </div>
          <button
            type="button"
            onClick={skip}
            className="shrink-0 self-start text-xs font-medium text-white/40 underline decoration-white/15 underline-offset-2 hover:text-white/70 sm:self-auto"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
