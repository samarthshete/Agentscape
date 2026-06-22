import type { ReactNode } from "react";

// A capability slug rendered as a mono tag. Optionally a link (directory filter)
// and an active state for the selected filter. Presentational only.
export function CapabilityTag({
  children,
  href,
  active = false,
}: {
  children: ReactNode;
  href?: string;
  active?: boolean;
}) {
  const className = active
    ? "inline-flex items-center rounded-badge border border-accent bg-verified-bg px-[9px] py-1 font-mono text-[11.5px] text-accent"
    : "inline-flex items-center rounded-badge border border-border bg-subtle px-[9px] py-1 font-mono text-[11.5px] text-foreground/80 transition-colors hover:border-faint hover:text-foreground";
  return href ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <span className={className}>{children}</span>
  );
}
