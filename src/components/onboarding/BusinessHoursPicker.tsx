import { cn } from "@/lib/utils";
import type { OnboardingFormData, CustomHoursDay, HoursMode } from "@/components/onboarding/types";

const DAY_LABELS: Record<CustomHoursDay["day"], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const MODE_LABELS: Record<HoursMode, string> = {
  standard: "Standard Mon–Fri",
  custom: "Custom Hours",
  "247": "Open 24/7",
};

function formatTime(value: string): string {
  if (!value) return "";
  const [hStr, mStr] = value.split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return value;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr ?? "00"} ${period}`;
}

function composeOpeningHours(
  mode: HoursMode,
  standardOpenTime: string,
  standardCloseTime: string,
  customHours: CustomHoursDay[],
): string {
  if (mode === "247") return "Open 24/7";
  if (mode === "standard") {
    return `Mon–Fri ${formatTime(standardOpenTime)}–${formatTime(standardCloseTime)}`;
  }
  const openDays = customHours.filter((d) => !d.closed);
  if (openDays.length === 0) return "Closed";
  return openDays.map((d) => `${DAY_LABELS[d.day]} ${formatTime(d.open)}–${formatTime(d.close)}`).join(", ");
}

export function BusinessHoursPicker({
  formData,
  setFormData,
}: {
  formData: OnboardingFormData;
  setFormData: (updater: (prev: OnboardingFormData) => OnboardingFormData) => void;
}) {
  const applyHours = (updates: Partial<OnboardingFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      return {
        ...next,
        openingHours: composeOpeningHours(
          next.hoursMode,
          next.standardOpenTime,
          next.standardCloseTime,
          next.customHours,
        ),
      };
    });
  };

  const updateCustomDay = (index: number, patch: Partial<CustomHoursDay>) => {
    const next = formData.customHours.map((d, i) => (i === index ? { ...d, ...patch } : d));
    applyHours({ customHours: next });
  };

  return (
    <div className="flex flex-col gap-3 text-left">
      <span className="text-sm font-medium text-zinc-700">Business Hours</span>

      <div className="flex flex-wrap gap-2.5">
        {(Object.keys(MODE_LABELS) as HoursMode[]).map((mode) => {
          const selected = formData.hoursMode === mode;
          return (
            <label
              key={mode}
              className={cn(
                "flex h-10 min-w-[140px] flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors",
                selected
                  ? "border-blue-500 bg-blue-50/50 text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 hover:bg-blue-50/30",
              )}
            >
              <input
                type="radio"
                name="hoursMode"
                className="sr-only"
                checked={selected}
                onChange={() => applyHours({ hoursMode: mode })}
              />
              {MODE_LABELS[mode]}
            </label>
          );
        })}
      </div>

      {formData.hoursMode === "standard" && (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Open</span>
            <input
              type="time"
              value={formData.standardOpenTime}
              onChange={(e) => applyHours({ standardOpenTime: e.target.value })}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Close</span>
            <input
              type="time"
              value={formData.standardCloseTime}
              onChange={(e) => applyHours({ standardCloseTime: e.target.value })}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </label>
        </div>
      )}

      {formData.hoursMode === "custom" && (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3.5">
          {formData.customHours.map((day, i) => (
            <div key={day.day} className="flex flex-wrap items-center gap-2.5">
              <span className="w-9 shrink-0 text-xs font-medium text-zinc-600">{DAY_LABELS[day.day]}</span>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500">
                <input
                  type="checkbox"
                  checked={!day.closed}
                  onChange={(e) => updateCustomDay(i, { closed: !e.target.checked })}
                />
                Open
              </label>
              {!day.closed && (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => updateCustomDay(i, { open: e.target.value })}
                    className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-zinc-400">to</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => updateCustomDay(i, { close: e.target.value })}
                    className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
