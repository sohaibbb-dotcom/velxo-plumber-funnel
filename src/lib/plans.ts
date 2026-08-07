/**
 * Canonical subscription plan values — the single source of truth every
 * other file (API routes, the Stripe checkout helper, the onboarding
 * wizard) imports from, so "ai_receptionist"/"complete" can never drift
 * into variants like "velxo_complete" across the codebase.
 */
export const PLAN_VALUES = ["ai_receptionist", "complete"] as const;

export type Plan = (typeof PLAN_VALUES)[number];

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && (PLAN_VALUES as readonly string[]).includes(value);
}

export const PLAN_LABELS: Record<Plan, string> = {
  ai_receptionist: "AI Receptionist",
  complete: "Velxo Complete",
};

/** Post-trial monthly price in AUD — must match the Stripe price configured for each plan. */
export const PLAN_MONTHLY_PRICE_AUD: Record<Plan, number> = {
  ai_receptionist: 297,
  complete: 397,
};
