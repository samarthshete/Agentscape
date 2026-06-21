import type { ReactNode } from "react";

// A capability slug rendered as a mono tag. Optionally a link (directory filter
// in 3b-ii); presentational only here.
export function CapabilityTag({
  children,
  href,
}: {
  children: ReactNode;
  href?: string;
}) {
  const className =
    "inline-flex items-center rounded-badge border border-border bg-subtle px-[9px] py-1 font-mono text-[11.5px] text-foreground/80 transition-colors hover:border-faint hover:text-foreground";
  return href ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <span className={className}>{children}</span>
  );
}
