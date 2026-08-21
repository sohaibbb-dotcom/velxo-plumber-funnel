"use client";

import dynamic from "next/dynamic";

/**
 * Perf Phase 1: below-the-fold sections are dynamically imported from
 * *inside* this client boundary (not from the server-rendered page.tsx)
 * so Turbopack actually code-splits each into its own chunk. Dynamically
 * importing a Client Component directly from a Server Component does not
 * reliably code-split in the App Router — see
 * node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md ("When a
 * Server Component dynamically imports a Client Component, automatic code
 * splitting is currently not supported"). Routing the dynamic() calls
 * through this "use client" module instead keeps each section's JS out of
 * the hero's hydration path while `ssr: true` (the default) still renders
 * full markup for every section server-side, so nothing disappears or
 * shifts on initial paint.
 *
 * CompleteUpsell, Demo and Showcase are no longer rendered here — their
 * conversion jobs are now absorbed elsewhere (CompleteUpsell's "need a
 * website too?" nudge lives inside Pricing; Demo duplicated the missed-call
 * story the hero and HowItWorks already tell; Showcase's full-width website
 * iframe risked re-centering the page on "we build websites" instead of the
 * AI Receptionist offer). Their files are untouched — just unmounted.
 */
const CapabilityStrip = dynamic(
  () => import("./CapabilityStrip").then((m) => m.CapabilityStrip),
  { ssr: true },
);
const HowItWorks = dynamic(
  () => import("./HowItWorks").then((m) => m.HowItWorks),
  { ssr: true },
);
const Calculator = dynamic(
  () => import("./Calculator").then((m) => m.Calculator),
  { ssr: true },
);
const WhyVelxo = dynamic(() => import("./WhyVelxo").then((m) => m.WhyVelxo), {
  ssr: true,
});
const Pricing = dynamic(() => import("./Pricing").then((m) => m.Pricing), {
  ssr: true,
});
const FAQ = dynamic(() => import("./FAQ").then((m) => m.FAQ), {
  ssr: true,
});
const FinalCTA = dynamic(
  () => import("./FinalCTA").then((m) => m.FinalCTA),
  { ssr: true },
);

export function BelowFold() {
  return (
    <>
      <CapabilityStrip />
      <HowItWorks />
      <Calculator />
      <WhyVelxo />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}
