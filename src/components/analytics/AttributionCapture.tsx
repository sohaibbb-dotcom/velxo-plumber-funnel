"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttributionFromUrl } from "@/lib/attribution";

/**
 * Global first-touch attribution capture, mounted once in the root layout
 * alongside <MetaPixel />. Previously captureAttributionFromUrl() was only
 * ever called from the /preview landing page, which meant a visitor entering
 * via the homepage (the AI Receptionist CTA's entry point, and the primary
 * Meta ad destination) never had ad-click params persisted at all — by the
 * time they reached /onboarding, getStoredAttribution() would return {}
 * regardless of how they actually arrived. captureAttributionFromUrl() itself
 * is unchanged: it already only overwrites stored attribution when new
 * tracked params are present in the current URL, so mounting this globally
 * doesn't change its first-touch-preserving behaviour, only which pages can
 * trigger a capture.
 */
function AttributionCaptureInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureAttributionFromUrl();
  }, [pathname, searchParams]);

  return null;
}

export function AttributionCapture() {
  return (
    <Suspense fallback={null}>
      <AttributionCaptureInner />
    </Suspense>
  );
}
