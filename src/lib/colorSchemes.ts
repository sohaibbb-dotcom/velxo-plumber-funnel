/**
 * The six brand colour schemes, ported exactly (same names, same hex
 * values) from the real onboarding flow (VELXO DIGITAL/onboarding.html).
 * Shared so the instant-preview form and the future in-app onboarding flow
 * can never drift apart on what "Dark Navy + Electric Blue" etc. actually
 * means in hex.
 */
export type ColorScheme = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
};

export const COLOR_SCHEMES: ColorScheme[] = [
  { name: "Dark Navy + Electric Blue", primaryColor: "#0a0f1e", secondaryColor: "#00a8ff" },
  { name: "Black + Orange Fire", primaryColor: "#0d0d0d", secondaryColor: "#ff6b1a" },
  { name: "White + Forest Green", primaryColor: "#f0f0f0", secondaryColor: "#2d7a3a" },
  { name: "Dark + Gold Luxury", primaryColor: "#1a1a2e", secondaryColor: "#d4a017" },
  { name: "Light Grey + Deep Red", primaryColor: "#e0e0e0", secondaryColor: "#c0392b" },
  { name: "White + Royal Blue", primaryColor: "#f5f5f5", secondaryColor: "#2952a3" },
];

export const DEFAULT_COLOR_SCHEME = COLOR_SCHEMES[0];

export function findColorScheme(name: string | null | undefined): ColorScheme {
  return COLOR_SCHEMES.find((scheme) => scheme.name === name) ?? DEFAULT_COLOR_SCHEME;
}
