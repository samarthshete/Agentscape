import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "text";

const BASE =
  "inline-flex items-center justify-center gap-1.5 h-[34px] px-[15px] rounded-control text-[13px] font-[540] whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground font-[560] hover:brightness-110 border border-transparent",
  secondary:
    "bg-card text-foreground border border-border hover:border-faint",
  text: "bg-transparent text-muted hover:text-foreground px-3",
};

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };
type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & { href: string };

// Presentational button. Renders an <a> when `href` is set, else a <button>.
export function Button(props: ButtonProps | AnchorProps) {
  const { variant = "primary", children } = props;
  const className = `${BASE} ${VARIANTS[variant]}`;

  if ("href" in props && props.href !== undefined) {
    const { variant: _v, children: _c, ...rest } = props;
    return (
      <a className={className} {...rest}>
        {children}
      </a>
    );
  }
  const { variant: _v, children: _c, href: _h, ...rest } = props as ButtonProps;
  return (
    <button className={className} {...rest}>
      {children}
    </button>
  );
}
