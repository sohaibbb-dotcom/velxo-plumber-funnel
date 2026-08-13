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

/**
 * Perf Phase 3B: the fbq stub, `fbq('init', ...)`, and the first
 * `fbq('track','PageView')` still run at the same early "afterInteractive"
 * timing as before (see the bootstrap Script below) — only the actual
 * fbevents.js payload (the measured ~232 KiB / ~300ms+ main-thread cost) is
 * deferred here. Every fbq(...) call made before this script finishes
 * loading is queued by Meta's own stub (`n.queue.push`) and replayed once
 * it's ready, so no event is lost — this only moves the SDK's own
 * execution cost out of the critical initial-loading window.
 */
function DeferredFacebookSdk() {
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (scheduledRef.current) return;
    scheduledRef.current = true;

    const inject = () => {
      if (fbEventsInjected) return;
      fbEventsInjected = true;
      const script = document.createElement("script");
      script.async = true;
      script.src = FBEVENTS_SRC;
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);
    };

    const scheduleIdleInject = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(inject, { timeout: 4000 });
      } else {
        // Safari (and any other browser without requestIdleCallback)
        // fallback: a fixed short delay after load instead of idle time.
        setTimeout(inject, 2000);
      }
    };

    if (document.readyState === "complete") {
      scheduleIdleInject();
      return;
    }

    window.addEventListener("load", scheduleIdleInject, { once: true });
    return () => window.removeEventListener("load", scheduleIdleInject);
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
