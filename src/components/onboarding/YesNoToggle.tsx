import { cn } from "@/lib/utils";

/**
 * A required yes/no choice, built from real radio inputs (not just styled
 * buttons) so the browser's native `required` validation blocks Continue
 * until one is picked — the same mechanism every other required field in
 * this wizard relies on.
 */
export function YesNoToggle({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="flex gap-2.5">
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map((option) => {
          const selected = value === option.val;
          return (
            <label
              key={option.label}
              className={cn(
                "flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                selected
                  ? "border-blue-500 bg-blue-50/50 text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 hover:bg-blue-50/30",
              )}
            >
              <input
                type="radio"
                name={name}
                required
                checked={selected}
                onChange={() => onChange(option.val)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
