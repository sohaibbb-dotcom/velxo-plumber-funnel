import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function StepProgress({ labels, activeIndex }: { labels: string[]; activeIndex: number }) {
  return (
    <div className="mb-6">
      {/* Mobile only: the full label row below (all 4-5 uppercase, tracked-out
          labels laid out with shrink-0) has no room to breathe under ~500px —
          Complete's 5 labels in particular collide on phone widths. Rather
          than shrinking text to the point of being unreadable, mobile gets
          its own compact dots + current-step-label treatment instead. */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center">
          {labels.map((label, i) => {
            const isDone = i < activeIndex;
            const isActive = i === activeIndex;
            const isLast = i === labels.length - 1;

            return (
              <div key={label} className={cn("flex items-center", !isLast && "flex-1")}>
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full transition-colors duration-300",
                    isActive ? "bg-violet-400 ring-4 ring-violet-400/20" : isDone ? "bg-violet-500/70" : "bg-white/15",
                  )}
                  aria-hidden
                />
                {!isLast && (
                  <span className="mx-1.5 h-px flex-1 overflow-hidden bg-white/10">
                    <motion.span
                      className="block h-full bg-violet-400"
                      initial={false}
                      animate={{ width: isDone ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: EASE }}
                    />
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-violet-300 uppercase">
          Step {activeIndex + 1} of {labels.length} · {labels[activeIndex]}
        </span>
      </div>

      {/* Tablet/desktop: unchanged full label stepper. */}
      <div className="hidden items-center sm:flex">
        {labels.map((label, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          const isLast = i === labels.length - 1;

          return (
            <div key={label} className={cn("flex items-center", !isLast && "flex-1")}>
              <span
                className={cn(
                  "shrink-0 text-[11px] font-semibold tracking-wide uppercase transition-colors duration-300",
                  isActive ? "text-violet-300" : isDone ? "text-white/60" : "text-white/25",
                )}
              >
                {label}
              </span>
              {!isLast && (
                <span className="mx-2 h-px flex-1 overflow-hidden bg-white/10">
                  <motion.span
                    className="block h-full bg-violet-400"
                    initial={false}
                    animate={{ width: isDone ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
