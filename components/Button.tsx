import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "text";

const BASE =
  "inline-flex items-center justify-center gap-1.5 h-[34px] px-[15px] rounded-control text-[13px] font-[540] whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground font-[560] hover:brightness-110 border border-transparent",
  secondary: "bg-card text-foreground border border-border hover:border-faint",
  text: "bg-transparent text-muted hover:text-foreground px-3",
};

interface Props {
  variant?: Variant;
  href?: string;
  type?: "button" | "submit" | "reset";
  target?: string;
  rel?: string;
  ariaLabel?: string;
  children: ReactNode;
}

// Presentational button. Internal href → next/link <Link>; external href → <a>;
// otherwise a <button>. (Internal nav must use Link for client routing + lint.)
export function Button({
  variant = "primary",
  href,
  type = "button",
  target,
  rel,
  ariaLabel,
  children,
}: Props) {
  const className = `${BASE} ${VARIANTS[variant]}`;

  if (href !== undefined) {
    if (href.startsWith("/") && !target) {
      return (
        <Link href={href} className={className} aria-label={ariaLabel}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className={className}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={className} type={type} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
