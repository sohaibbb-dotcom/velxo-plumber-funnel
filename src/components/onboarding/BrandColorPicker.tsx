import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_SCHEMES } from "@/lib/colorSchemes";

/**
 * Same six named colour schemes as PreviewRequestFlow's picker (both read
 * from the shared src/lib/colorSchemes.ts so the hex values can't drift) —
 * duplicated here as its own compact UI rather than imported, since it
 * isn't exported as a shared component today.
 */
export function BrandColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">Brand Colours</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {COLOR_SCHEMES.map((scheme) => {
          const selected = scheme.name === value;
          return (
            <button
              key={scheme.name}
              type="button"
              onClick={() => onChange(scheme.name)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-center gap-2.5 rounded-xl border px-2.5 py-4 text-center transition-colors",
                selected
                  ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                  : "border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/30",
              )}
            >
              <span className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-zinc-200">
                <span className="h-full w-1/2" style={{ backgroundColor: scheme.primaryColor }} />
                <span className="h-full w-1/2" style={{ backgroundColor: scheme.secondaryColor }} />
                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-tight font-medium",
                  selected ? "text-zinc-900" : "text-zinc-600",
                )}
              >
                {scheme.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
