import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

// Server-only domain-challenge fetcher with SSRF guards. The token lives at a
// FIXED path on the operator's domain; we build the URL ourselves (the operator
// only supplies a validated bare hostname) so there is no way to inject a path,
// port, scheme, or credentials. Before any network call we resolve the host and
// reject any private / loopback / link-local / reserved address.

export const CHALLENGE_FILENAME = "agentscape-challenge.txt";
export const CHALLENGE_PATH = `/.well-known/${CHALLENGE_FILENAME}`;

const TIMEOUT_MS = 3000;
const MAX_BYTES = 4096;

export type VerifyFailure =
  | "invalid_domain"
  | "blocked_address"
  | "unreachable"
  | "not_found"
  | "mismatch";

export class ChallengeError extends Error {
  constructor(
    public readonly reason: VerifyFailure,
    message: string,
  ) {
    super(message);
    this.name = "ChallengeError";
  }
}

// --- hostname validation -----------------------------------------------------

// Accept a bare registrable hostname; tolerate a pasted URL by stripping the
// scheme / path / port / userinfo. Returns the clean host or null if invalid.
export function normalizeDomain(raw: string): string | null {
  let d = raw.trim().toLowerCase();
  if (!d) return null;
  d = d.replace(/^https?:\/\//, ""); // strip scheme if a URL was pasted
  d = d.split("/")[0] ?? ""; // drop any path
  const at = d.split("@");
  d = at[at.length - 1] ?? d; // drop userinfo
  d = d.split(":")[0] ?? ""; // drop port
  if (d.endsWith(".")) d = d.slice(0, -1); // drop trailing dot
  return isValidPublicHostname(d) ? d : null;
}

export function isValidPublicHostname(host: string): boolean {
  if (host.length === 0 || host.length > 253) return false;
  if (net.isIP(host) !== 0) return false; // must be a name, never an IP literal
  if (!host.includes(".")) return false; // must be a FQDN
  if (host.includes("..")) return false;
  return host
    .split(".")
    .every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

// --- IP classification (SSRF) ------------------------------------------------

function ipv4IsPublic(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4) return false;
  const [a, b, c] = parts as [number, number, number, number];
  if ([a, b, c, parts[3]].some((n) => !Number.isInteger(n) || n! < 0 || n! > 255)) {
    return false;
  }
  if (a === 0) return false; // 0.0.0.0/8 "this network"
  if (a === 10) return false; // private
  if (a === 127) return false; // loopback
  if (a === 169 && b === 254) return false; // link-local
  if (a === 172 && b >= 16 && b <= 31) return false; // private
  if (a === 192 && b === 168) return false; // private
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT 100.64/10
  if (a === 192 && b === 0) return false; // 192.0.0/24 + 192.0.2/24 (reserved/test)
  if (a === 198 && (b === 18 || b === 19)) return false; // 198.18/15 benchmarking
  if (a === 198 && b === 51) return false; // 198.51.100/24 test-net-2
  if (a === 203 && b === 0) return false; // 203.0.113/24 test-net-3
  if (a === 192 && b === 88 && c === 99) return false; // 6to4 relay anycast
  if (a >= 224) return false; // 224/4 multicast + 240/4 reserved + 255.255.255.255
  return true;
}

function ipv6IsPublic(ip: string): boolean {
  const addr = ip.toLowerCase();
  if (addr === "::1" || addr === "::") return false; // loopback / unspecified
  // IPv4-mapped / -compatible (::ffff:a.b.c.d) → classify the embedded IPv4.
  const mapped = addr.match(/(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4IsPublic(mapped[1] ?? "");
  if (addr.startsWith("fe8") || addr.startsWith("fe9") || addr.startsWith("fea") || addr.startsWith("feb")) {
    return false; // fe80::/10 link-local
  }
  if (addr.startsWith("fc") || addr.startsWith("fd")) return false; // fc00::/7 ULA
  if (addr.startsWith("ff")) return false; // ff00::/8 multicast
  if (addr.startsWith("2001:db8")) return false; // documentation
  if (addr.startsWith("::ffff:")) return false; // any other v4-mapped form
  return true;
}

export function isPublicIp(ip: string): boolean {
  const fam = net.isIP(ip);
  if (fam === 4) return ipv4IsPublic(ip);
  if (fam === 6) return ipv6IsPublic(ip);
  return false;
}

// Resolve the host and reject if ANY returned address is non-public. Runs BEFORE
// any fetch, so a domain pointing at an internal IP never gets a request.
export async function assertHostResolvesPublic(host: string): Promise<void> {
  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new ChallengeError("unreachable", "Could not resolve that domain.");
  }
  if (records.length === 0) {
    throw new ChallengeError("unreachable", "That domain has no DNS records.");
  }
  for (const r of records) {
    if (!isPublicIp(r.address)) {
      throw new ChallengeError(
        "blocked_address",
        `That domain resolves to a non-public address (${r.address}); refusing to fetch.`,
      );
    }
  }
}

// --- the fetch ---------------------------------------------------------------

// Fetch the challenge file over HTTPS (no redirects, ~3s timeout, small body)
// and return its trimmed contents. Throws ChallengeError on any problem.
export async function fetchChallengeToken(host: string): Promise<string> {
  await assertHostResolvesPublic(host); // SSRF guard first

  const url = `https://${host}${CHALLENGE_PATH}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      redirect: "manual", // no redirects — a redirect is a verification failure
      signal: controller.signal,
      headers: { "user-agent": "Agentscape-Verifier/1.0", accept: "text/plain" },
      cache: "no-store",
    });
  } catch {
    throw new ChallengeError("unreachable", "Could not reach the challenge URL over HTTPS.");
  } finally {
    clearTimeout(timer);
  }

  if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
    throw new ChallengeError("not_found", "The challenge URL redirected; redirects are not allowed.");
  }
  if (!res.ok) {
    throw new ChallengeError("not_found", `Challenge file not found (HTTP ${res.status}).`);
  }

  const body = await res.text();
  return body.slice(0, MAX_BYTES).trim();
}

// Best-effort registrable host from a stored endpoint/docs URL, for prefilling
// the verify form. Pure, no network.
export function hostnameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const h = new URL(url).hostname.toLowerCase();
    return isValidPublicHostname(h) ? h : null;
  } catch {
    return null;
  }
}
