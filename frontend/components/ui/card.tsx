import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[0_0_0_1px_rgba(0,102,255,0.1)]",
        className
      )}
      {...props}
    />
  );
}
