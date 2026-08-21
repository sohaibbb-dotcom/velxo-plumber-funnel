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
      <span className="text-sm font-medium text-white/75">Brand Colours</span>
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
                  ? "border-violet-400/60 bg-violet-500/10 ring-1 ring-violet-400/60"
                  : "border-white/10 bg-white/[0.03] hover:border-violet-400/30 hover:bg-white/[0.05]",
              )}
            >
              <span className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15">
                <span className="h-full w-1/2" style={{ backgroundColor: scheme.primaryColor }} />
                <span className="h-full w-1/2" style={{ backgroundColor: scheme.secondaryColor }} />
                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-sm">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-tight font-medium",
                  selected ? "text-white" : "text-white/55",
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
