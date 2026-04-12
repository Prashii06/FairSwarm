import Link from "next/link";

import { cn } from "@/lib/utils";

type FairSwarmLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
};

const sizes = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-14 w-14 text-lg",
};

export function FairSwarmLogo({ className, size = "md", href = "/" }: FairSwarmLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-3 transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]",
        className
      )}
      role="img"
      aria-label="FairSwarm home"
    >
      <div
        className={cn(
          "grid place-items-center rounded-md border border-primary bg-surface font-bold tracking-tight text-primary",
          sizes[size]
        )}
      >
        FS
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">FairSwarm</p>
        <p className="text-xs text-slate-400">Bias Intelligence Platform</p>
      </div>
    </Link>
  );
}
