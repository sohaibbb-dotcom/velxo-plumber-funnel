import { Bebas_Neue, DM_Sans } from "next/font/google";

/**
 * Same two typefaces the reference project's richer builds use (Bebas Neue
 * for display/headings, DM Sans for body copy) — self-hosted via next/font
 * so there's no external Google Fonts request and no layout shift. Scoped
 * to the preview route only: applied via these two CSS variables on the
 * `.preview-template` wrapper, not on the root layout.
 */
export const previewHeadingFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-preview-head",
  display: "swap",
});

export const previewBodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-preview-body",
  display: "swap",
});
