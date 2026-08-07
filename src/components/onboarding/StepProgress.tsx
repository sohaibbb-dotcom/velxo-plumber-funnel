import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function StepProgress({ labels, activeIndex }: { labels: string[]; activeIndex: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {labels.map((label, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          const isLast = i === labels.length - 1;

          return (
            <div key={label} className={cn("flex items-center", !isLast && "flex-1")}>
              <span
                className={cn(
                  "shrink-0 text-[11px] font-semibold tracking-wide uppercase transition-colors duration-300",
                  isActive ? "text-blue-600" : isDone ? "text-zinc-600" : "text-zinc-300",
                )}
              >
                {label}
              </span>
              {!isLast && (
                <span className="mx-2 h-px flex-1 overflow-hidden bg-zinc-100">
                  <motion.span
                    className="block h-full bg-blue-500"
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
