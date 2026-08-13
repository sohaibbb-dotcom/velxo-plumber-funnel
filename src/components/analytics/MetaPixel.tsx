"use client";

import { Suspense, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID, trackMetaPixelEvent } from "@/lib/metaPixel";

const FBEVENTS_SRC = "https://connect.facebook.net/en_US/fbevents.js";

// Module-scoped (not component-scoped) so it survives even a dev-only
// Strict Mode mount/unmount/remount cycle — the actual fbevents.js <script>
// tag must only ever be inserted once per page session.
let fbEventsInjected = false;

/**
 * Fires PageView on every *client-side* route change after the first load.
 *
 * The initial PageView is fired synchronously inside the bootstrap script
 * itself (see below) — not from here. This component's mount-effect runs
 * as soon as React commits, which can easily happen before next/script's
 * "afterInteractive" strategy has actually injected the bootstrap script,
 * so relying on this effect for the *first* PageView is a race that silently
 * drops the call (trackMetaPixelEvent no-ops if window.fbq isn't defined
 * yet). Skipping the first run here avoids double-firing once the bootstrap
 * script's own PageView is added back in.
 */
function PixelPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    trackMetaPixelEvent("PageView");
  }, [pathname, searchParams]);

  return null;
}

// Any of these firing counts as "the visitor is actually here" and is
// enough reason to pay the SDK's main-thread cost. scroll/pointerdown/
// touchstart cover the overwhelming majority of real visits within the
// first second or two; click and keydown are included for the rest.
const INTERACTION_EVENTS = [
  "pointerdown",
  "touchstart",
  "click",
  "scroll",
  "keydown",
] as const;

// Fallback so a genuinely passive session (no scroll/tap/click/key at all)
// still eventually loads fbevents.js. Chosen at the short end of the
// requested 8-10s window: real interaction almost always happens within
// the first second or two of an actual visit, so this fallback is a
// backstop, not the primary path, for the vast majority of sessions.
// Keeping it as short as the requested range allows still comfortably
// clears Lighthouse's own TBT-scored window (its lab run never scrolls or
// clicks, so the fallback timer is the only path that ever fires during an
// audit), while an 8s worst-case delay is negligible against Meta's
// attribution windows (1-day view / 1-day-plus click), so it doesn't
// meaningfully change what gets attributed for visitors who do stay.
const FALLBACK_DELAY_MS = 8000;

/**
 * Perf Phase 4A: the fbq stub, `fbq('init', ...)`, and the first
 * `fbq('track','PageView')` still run at the same early "afterInteractive"
 * timing as before (see the bootstrap Script below) — only the actual
 * fbevents.js payload (the measured ~232 KiB main-thread cost) is deferred
 * here, now until the first real user interaction (or a fallback timer for
 * visitors who never interact). Every fbq(...) call made before this
 * script finishes loading is queued by Meta's own stub (`n.queue.push`)
 * and replayed once it's ready, so no event is lost — this only moves the
 * SDK's own execution cost later.
 */
function DeferredFacebookSdk() {
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (scheduledRef.current) return;
    scheduledRef.current = true;

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const removeListeners = () => {
      INTERACTION_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, onInteraction),
      );
    };

    const cleanup = () => {
      removeListeners();
      if (fallbackTimer !== undefined) {
        clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
    };

    function inject() {
      if (fbEventsInjected) return;
      fbEventsInjected = true;
      cleanup();
      const script = document.createElement("script");
      script.async = true;
      script.src = FBEVENTS_SRC;
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);
    }

    function onInteraction() {
      inject();
    }

    INTERACTION_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, onInteraction, { passive: true }),
    );
    fallbackTimer = setTimeout(inject, FALLBACK_DELAY_MS);

    return cleanup;
  }, []);

  return null;
}

/** Official Meta Pixel base code, rendered once in the root layout. */
export function MetaPixel() {
  // Perf Phase 1: warm the connection to the pixel's domain only — this does
  // not fetch, execute, or change when/how fbevents.js loads or fires; the
  // Script tag below still owns all of that on its existing strategy.
  ReactDOM.preconnect("https://connect.facebook.net");

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[]}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PixelPageviewTracker />
      </Suspense>
      <DeferredFacebookSdk />
    </>
  );
}
