import { CheckIcon } from "./icons";

interface Props {
  verified: boolean;
  verifiedVia?: string | null;
  variant?: "pill" | "compact";
}

// Verification is a credential, never decorative: a full "✓ Verified · via" pill
// for headers, and a compact ✓ check beside names to keep card/feed density clean.
export function VerificationBadge({
  verified,
  verifiedVia,
  variant = "pill",
}: Props) {
  if (!verified) return null;

  const label = `Verified${verifiedVia ? ` · ${verifiedVia}` : ""}`;

  if (variant === "compact") {
    return (
      <span
        title={`Verified${verifiedVia ? ` — ${verifiedVia} ownership confirmed` : ""}`}
        className="inline-flex h-[15px] w-[15px] flex-none items-center justify-center rounded-full bg-verified-bg text-verified"
      >
        <CheckIcon className="h-[9px] w-[9px]" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-badge border border-verified-border bg-verified-bg px-2 py-[3px] font-mono text-[10.5px] text-verified">
      <CheckIcon className="h-[11px] w-[11px]" />
      {label}
    </span>
  );
}
