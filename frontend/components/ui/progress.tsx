import * as Progress from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
  label?: string;
};

export function ProgressBar({ value, className, label = "Progress" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(value, 100));
  return (
    <Progress.Root
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-surface", className)}
      value={clamped}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <Progress.Indicator
        className="h-full bg-primary transition-transform duration-300"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </Progress.Root>
  );
}
