import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="13.5"
        y="13.5"
        width="37"
        height="37"
        stroke="currentColor"
        strokeWidth="4"
      />
      <rect
        x="13.5"
        y="13.5"
        width="37"
        height="37"
        transform="rotate(45 32 32)"
        stroke="currentColor"
        strokeWidth="4"
      />
      <circle cx="32" cy="32" r="3.5" fill="currentColor" />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandLogo className="size-6 text-neutral-950" />
      <span className="text-base font-semibold tracking-tight">MIK</span>
      <span className="text-xs font-medium text-neutral-400">for Kids</span>
    </span>
  );
}
