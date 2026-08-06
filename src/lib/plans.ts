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
