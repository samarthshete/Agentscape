import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Centralized rate limiting (Phase 5b). One place creates the Upstash client and
// all limiters; callers (server actions) just call rateLimit(bucket, key).
//
// FAIL-OPEN: if the Upstash env vars are absent (local dev) or Redis errors, we
// allow the request and log a warning. Limiting only ever ENGAGES where it's
// configured (production). A misconfigured/unreachable limiter must never block a
// legitimate user or break local dev.
//
// This is a guard in FRONT of actions — it does not change what any action
// returns, the DAL-only-DB rule, RLS, the renderers, or any machine surface.

export type RateBucket = "mutation" | "interaction" | "verify" | "auth";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Sliding-window ceilings: generous enough that no real person hits them, low
// enough to stop a scripted loop. Verify is much stricter than likes because each
// attempt triggers an outbound HTTPS fetch + a service-role write.
let limiters: Record<RateBucket, Ratelimit> | null = null;
let warned = false;

if (url && token) {
  const redis = new Redis({ url, token });
  const make = (tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1], prefix: string) =>
    new Ratelimit({
      redis,
      prefix,
      analytics: false,
      limiter: Ratelimit.slidingWindow(tokens, window),
    });
  limiters = {
    // create/update agent + create post (combined, per user)
    mutation: make(20, "1 m", "as:rl:mut"),
    // follow / like / bookmark toggles (per user) — cheap + frequent
    interaction: make(60, "1 m", "as:rl:int"),
    // domain-verify attempts (per user) — outbound fetch + service-role write
    verify: make(5, "10 m", "as:rl:vrf"),
    // OAuth sign-in initiation (per IP)
    auth: make(10, "10 m", "as:rl:auth"),
  };
}

function warnOnce(): void {
  if (!warned) {
    console.warn(
      "[ratelimit] Upstash not configured (UPSTASH_REDIS_REST_URL / " +
        "UPSTASH_REDIS_REST_TOKEN absent) — rate limiting DISABLED (fail-open).",
    );
    warned = true;
  }
}

export interface RateResult {
  ok: boolean;
  /** Seconds until the window frees up (0 when allowed). */
  retryAfterSec: number;
}

/**
 * Check (and consume) one unit from `bucket` for `key` (a user id or IP).
 * Fail-open: returns `{ ok: true }` when unconfigured or on any Redis error.
 */
export async function rateLimit(bucket: RateBucket, key: string): Promise<RateResult> {
  if (!limiters) {
    warnOnce();
    return { ok: true, retryAfterSec: 0 };
  }
  try {
    const r = await limiters[bucket].limit(key);
    return {
      ok: r.success,
      retryAfterSec: r.success ? 0 : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
    };
  } catch (e) {
    // A Redis hiccup must never block a legit user.
    console.warn("[ratelimit] limiter error — failing open:", (e as Error).message);
    return { ok: true, retryAfterSec: 0 };
  }
}

/** Best-effort client IP for anonymous (per-IP) limits. */
export async function clientIp(): Promise<string> {
  // Lazy import so the limiter core stays free of the request-only next/headers.
  const { headers } = await import("next/headers");
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") ?? "unknown";
}

/** A friendly, non-technical message for a limited action. */
export function rateLimitMessage(retryAfterSec: number): string {
  const wait = retryAfterSec > 0 ? ` Try again in ${retryAfterSec}s.` : "";
  return `You're doing that a bit too fast.${wait}`;
}
