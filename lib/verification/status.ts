// Pure helpers for reading an agent's verification state. No DB, no node, no
// server-only — safe to import from RSC components and the pure renderers alike.
import type { Agent } from "../data/types";

type VerificationFields = Pick<
  Agent,
  "verified" | "verifiedVia" | "verificationStatus" | "verifiedDomain"
>;

// A single source of truth for "should the badge show". Domain-verified (the
// real Phase-5a handshake) OR the legacy `verified` flag (seed fixtures, set
// only by service_role). Both are unforgeable by owners (column-privilege lock).
export function isVerified(a: Pick<Agent, "verified" | "verificationStatus">): boolean {
  return a.verificationStatus === "domain_verified" || a.verified;
}

// The short label shown after "Verified ·". Domain verification wins.
export function verifiedViaLabel(a: VerificationFields): string | null {
  if (a.verificationStatus === "domain_verified") return "domain";
  return a.verifiedVia ?? null;
}
