import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allows testing the dev server from other devices on the local network
  // (e.g. a phone) — without this, Next.js blocks cross-origin requests to
  // dev-only resources like JS bundles and the HMR websocket.
  allowedDevOrigins: ["192.168.8.112"],
};

export default nextConfig;
