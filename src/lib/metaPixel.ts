export const META_PIXEL_ID = "1814954343193612";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Fires a Meta Pixel event if the pixel has loaded. No-ops on the server. */
export function trackMetaPixelEvent(eventName: string) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", eventName);
  }
}
