import type { CSSProperties } from "react";

/** Matches the reference template's hexToRgb() exactly — same 3/6-digit handling. */
export function hexToRgb(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function toRgbTuple(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).split(",").map(Number);
  return [r, g, b];
}

/** WCAG relative luminance — used only to decide light-mode vs dark-mode, not for contrast ratios. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isLightScheme(primaryColor: string): boolean {
  return relativeLuminance(toRgbTuple(primaryColor)) > 0.5;
}

function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

/**
 * CSS custom properties for the ported template's colour system, set as
 * inline styles on the `.preview-template` wrapper.
 *
 * The reference project actually ships two visual "species": prospects with
 * a light selected palette (e.g. A&C Wood Plumbing, white + forest green)
 * get a light body with two fixed dark "bookend" sections (hero, contact,
 * footer); prospects with a dark selected palette (e.g. the Melbourne inner-
 * west builds) get one continuous dark page. Rather than force every scheme
 * through a single always-dark stylesheet — which is what produced invisible
 * white-on-white text for the light schemes — this computes which species a
 * given primary colour belongs to and emits the matching light/dark token
 * set. The stylesheet itself stays static; only these tokens vary per request.
 */
export function buildThemeVars(primaryColor: string, secondaryColor: string): CSSProperties {
  const accentRgb = hexToRgb(secondaryColor);
  const accentTuple = toRgbTuple(secondaryColor);
  const light = isLightScheme(primaryColor);

  const text = light ? "#1a1a1a" : "#ffffff";
  const textMid = light ? "#4a4a4a" : "rgba(255,255,255,0.70)";
  const textLight = light ? "#7a7a7a" : "rgba(255,255,255,0.45)";
  const border = `rgba(${accentRgb},${light ? 0.22 : 0.22})`;
  const borderLight = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.10)";
  const cardBg = light ? "#ffffff" : "rgba(255,255,255,0.05)";
  const bgAlt = light
    ? mix(toRgbTuple(primaryColor), accentTuple, 0.05)
    : mix(toRgbTuple(primaryColor), [255, 255, 255], 0.03);

  return {
    "--mode": light ? "light" : "dark",
    "--bg": primaryColor,
    "--bg-alt": bgAlt,
    "--text": text,
    "--text-mid": textMid,
    "--text-light": textLight,
    "--border": border,
    "--border-light": borderLight,
    "--card-bg": cardBg,
    "--accent": secondaryColor,
    "--accent-rgb": accentRgb,
    "--glow": `rgba(${accentRgb},0.14)`,
    "--glow-strong": `rgba(${accentRgb},0.50)`,
  } as CSSProperties;
}
