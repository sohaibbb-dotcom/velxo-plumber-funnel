"use client";

import { Suspense, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID, trackMetaPixelEvent } from "@/lib/metaPixel";

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
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
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
    </>
  );
}
