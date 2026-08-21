import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const SERVICE_OPTIONS = [
  "General Plumbing",
  "Emergency Repairs",
  "Hot Water Systems",
  "Drain Cleaning",
  "Gas Fitting",
  "Bathroom Renovations",
];

export function ServiceCheckboxes({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (service: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-white/75">Services Offered</span>
      <div className="grid grid-cols-2 gap-2.5">
        {SERVICE_OPTIONS.map((service) => {
          const isSelected = selected.includes(service);
          return (
            <button
              key={service}
              type="button"
              onClick={() => onToggle(service)}
              aria-pressed={isSelected}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                isSelected
                  ? "border-violet-400/60 bg-violet-500/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-violet-400/30 hover:bg-white/[0.05]",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelected ? "border-violet-500 bg-violet-500 text-white" : "border-white/20 bg-white/5",
                )}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              {service}
            </button>
          );
        })}
      </div>
    </div>
  );
}
