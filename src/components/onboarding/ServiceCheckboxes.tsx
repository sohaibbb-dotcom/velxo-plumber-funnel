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
      <span className="text-sm font-medium text-zinc-700">Services Offered</span>
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
                  ? "border-blue-500 bg-blue-50/50 text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 hover:bg-blue-50/30",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 bg-white",
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
