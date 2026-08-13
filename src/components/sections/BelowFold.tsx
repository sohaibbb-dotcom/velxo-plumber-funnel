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
 */
const Capabilities = dynamic(
  () => import("./Capabilities").then((m) => m.Capabilities),
  { ssr: true },
);
const CompleteUpsell = dynamic(
  () => import("./CompleteUpsell").then((m) => m.CompleteUpsell),
  { ssr: true },
);
const Problem = dynamic(() => import("./Problem").then((m) => m.Problem), {
  ssr: true,
});
const Demo = dynamic(() => import("./Demo").then((m) => m.Demo), {
  ssr: true,
});
const Comparison = dynamic(
  () => import("./Comparison").then((m) => m.Comparison),
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
const Showcase = dynamic(() => import("./Showcase").then((m) => m.Showcase), {
  ssr: true,
});

export function BelowFold() {
  return (
    <>
      <Capabilities />
      <CompleteUpsell />
      <Problem />
      <Demo />
      <Comparison />
      <Calculator />
      <WhyVelxo />
      <Pricing />
      <Showcase />
    </>
  );
}
