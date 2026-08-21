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
      <span className="text-sm font-medium text-white/75">Business Hours</span>

      <div className="flex flex-wrap gap-2.5">
        {(Object.keys(MODE_LABELS) as HoursMode[]).map((mode) => {
          const selected = formData.hoursMode === mode;
          return (
            <label
              key={mode}
              className={cn(
                "flex h-10 min-w-[140px] flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors",
                selected
                  ? "border-violet-400/60 bg-violet-500/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-violet-400/30 hover:bg-white/[0.05]",
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
            <span className="text-xs font-medium text-white/50">Open</span>
            <input
              type="time"
              value={formData.standardOpenTime}
              onChange={(e) => applyHours({ standardOpenTime: e.target.value })}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white outline-none transition-colors [color-scheme:dark] focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/50">Close</span>
            <input
              type="time"
              value={formData.standardCloseTime}
              onChange={(e) => applyHours({ standardCloseTime: e.target.value })}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white outline-none transition-colors [color-scheme:dark] focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20"
            />
          </label>
        </div>
      )}

      {formData.hoursMode === "custom" && (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          {formData.customHours.map((day, i) => (
            <div key={day.day} className="flex flex-wrap items-center gap-2.5">
              <span className="w-9 shrink-0 text-xs font-medium text-white/60">{DAY_LABELS[day.day]}</span>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-white/50">
                <input
                  type="checkbox"
                  checked={!day.closed}
                  onChange={(e) => updateCustomDay(i, { closed: !e.target.checked })}
                  className="accent-violet-500"
                />
                Open
              </label>
              {!day.closed && (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => updateCustomDay(i, { open: e.target.value })}
                    className="h-9 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none [color-scheme:dark] focus:border-violet-400/60"
                  />
                  <span className="text-xs text-white/35">to</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => updateCustomDay(i, { close: e.target.value })}
                    className="h-9 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none [color-scheme:dark] focus:border-violet-400/60"
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
