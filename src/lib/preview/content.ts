import type {
  HeadlineParts,
  PreviewData,
  PreviewRequestRow,
  ServiceItem,
  SubheadlineParts,
} from "./types";
import { hexToRgb } from "./theme";
import { DEFAULT_COLOR_SCHEME } from "@/lib/colorSchemes";

export const DEFAULT_PRIMARY_COLOR = DEFAULT_COLOR_SCHEME.primaryColor;
export const DEFAULT_SECONDARY_COLOR = DEFAULT_COLOR_SCHEME.secondaryColor;

const DEFAULT_SERVICES = [
  "General Plumbing",
  "Emergency Plumbing",
  "Blocked Drains",
  "Hot Water Repairs",
  "Leak Detection",
  "Tap & Toilet Repairs",
];

/**
 * Keyword -> themed service list. Matched against the submitted
 * primary_service (case-insensitive substring match, first match wins).
 * The "drain" theme intentionally matches the exact example given for
 * "Blocked Drains".
 */
const SERVICE_THEMES: { keywords: string[]; services: string[] }[] = [
  {
    keywords: ["drain"],
    services: [
      "Blocked Drains",
      "Emergency Plumbing",
      "Drain Cleaning",
      "CCTV Drain Inspections",
      "Burst Pipes",
      "General Plumbing",
    ],
  },
  {
    keywords: ["hot water"],
    services: [
      "Hot Water Systems",
      "Hot Water Repairs",
      "Emergency Plumbing",
      "Blocked Drains",
      "Gas Fitting",
      "General Plumbing",
    ],
  },
  {
    keywords: ["gas"],
    services: [
      "Gas Fitting",
      "Gas Leak Repairs",
      "Hot Water Systems",
      "Emergency Plumbing",
      "General Plumbing",
      "Blocked Drains",
    ],
  },
  {
    keywords: ["bathroom", "renovation"],
    services: [
      "Bathroom Renovations",
      "Tapware Installation",
      "Leak Detection",
      "Hot Water Systems",
      "General Plumbing",
      "Blocked Drains",
    ],
  },
  {
    keywords: ["emergency"],
    services: [
      "Emergency Plumbing",
      "Burst Pipes",
      "Blocked Drains",
      "Hot Water Repairs",
      "Leak Detection",
      "General Plumbing",
    ],
  },
];

/** Distinct, specific copy per canonical service title — never a single reused sentence. */
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "General Plumbing":
    "All-round repairs, installations and maintenance for taps, pipes and fixtures around the home.",
  "Emergency Plumbing":
    "Burst pipes, gas smells and no-hot-water emergencies — call any time, day or night.",
  "Blocked Drains":
    "Stubborn blockages cleared fast, with the actual cause diagnosed so it doesn't just come back.",
  "Drain Cleaning":
    "Routine and deep drain cleaning to keep water flowing freely and stop blockages before they start.",
  "CCTV Drain Inspections":
    "Camera inspections that pinpoint blockages, cracks and tree-root intrusion without digging up your yard.",
  "Hot Water Repairs":
    "Diagnosis and repair for hot water systems that are leaking, cold, or on their way out.",
  "Hot Water Systems":
    "Supply, installation and servicing of gas, electric and continuous-flow hot water systems.",
  "Leak Detection":
    "Non-invasive leak detection to find hidden pipe leaks before they cause real water damage.",
  "Tap & Toilet Repairs":
    "Leaking taps, running toilets and worn fittings repaired or replaced with minimal mess.",
  "Burst Pipes":
    "Fast response to burst and damaged pipes to stop the water and get the repair done properly.",
  "Gas Fitting":
    "Gas fitting for cooktops, hot water systems and appliances, carried out safely and to code.",
  "Gas Leak Repairs":
    "Prompt detection and repair of gas leaks, treated as a priority job every time.",
  "Bathroom Renovations":
    "Full plumbing for bathroom renovations, from rough-in through to fixtures and finishing.",
  "Tapware Installation":
    "Supply and installation of taps, mixers and fittings for kitchens and bathrooms.",
};

function describeService(title: string): string {
  return (
    SERVICE_DESCRIPTIONS[title] ??
    `Reliable, professional ${title.toLowerCase()} carried out with clear communication throughout.`
  );
}

export function generateServices(
  primaryService: string,
  existing: string[] | null,
): ServiceItem[] {
  if (existing && existing.length > 0) {
    return existing.map((title) => ({ title, description: describeService(title) }));
  }

  const needle = primaryService.toLowerCase();
  const theme = SERVICE_THEMES.find((t) => t.keywords.some((k) => needle.includes(k)));
  const titles = theme ? theme.services : DEFAULT_SERVICES;
  return titles.map((title) => ({ title, description: describeService(title) }));
}

/** Matches the reference template's hardcoded hero H1 exactly when no custom copy exists. */
export function generateHeadline(suburb: string, existing: string | null): HeadlineParts {
  if (existing) {
    return { prefix: existing, accent: null, suffix: "" };
  }
  return { prefix: `${suburb}'s`, accent: "Most Trusted", suffix: "Plumbers" };
}

/**
 * Default hero subheading when no custom copy exists. Mirrors the reference
 * template's structure (bolded phrase + surrounding text) but avoids its
 * unverifiable response-time guarantee and licensing claim — this preview
 * has no factual basis for either about a business it's never met.
 */
export function generateSubheadline(
  suburb: string,
  existing: string | null,
): SubheadlineParts {
  if (existing) {
    return { before: existing, bold: null, after: "" };
  }
  return {
    before: "Fast, reliable plumbing — available ",
    bold: "day or night",
    after: `, servicing ${suburb} and the surrounding area.`,
  };
}

export function resolveColors(row: PreviewRequestRow) {
  const primaryColor = row.primary_color || DEFAULT_PRIMARY_COLOR;
  const secondaryColor = row.secondary_color || DEFAULT_SECONDARY_COLOR;
  return { primaryColor, secondaryColor, accentRgb: hexToRgb(secondaryColor) };
}

/** Splits a business name into "rest" + "last word" for the accent-highlighted wordmark. */
export function splitBusinessNameForLogo(businessName: string) {
  const words = businessName.trim().split(/\s+/);
  const last = words.pop() ?? businessName;
  return { rest: words.join(" "), last };
}

export function firstWord(businessName: string): string {
  return businessName.trim().split(/\s+/)[0] ?? businessName;
}

export function buildPreviewData(row: PreviewRequestRow): PreviewData {
  const { primaryColor, secondaryColor } = resolveColors(row);

  return {
    publicId: row.public_id,
    businessName: row.business_name,
    phone: row.phone,
    suburb: row.suburb,
    primaryService: row.primary_service,
    website: row.website,
    headline: generateHeadline(row.suburb, row.generated_headline),
    subheadline: generateSubheadline(row.suburb, row.generated_subheadline),
    services: generateServices(row.primary_service, row.generated_services),
    primaryColor,
    secondaryColor,
  };
}
