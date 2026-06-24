// Phase 5b: confirm rate limiting. Behavior depends on whether Upstash is set in
// .env.local:
//   - configured   → the strict "verify" bucket (5 / 10 min) blocks after 5 hits
//   - NOT configured → fail-open: every call is allowed, with a logged warning
//
// Run:  NODE_OPTIONS=--conditions=react-server npx tsx db/verify/verify_ratelimit.ts
//
// dotenv must load BEFORE lib/ratelimit (which reads env at import), so the
// limiter is imported dynamically after config().
import { config } from "dotenv";
config({ path: ".env.local" });

async function main(): Promise<void> {
  const configured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );

  const { rateLimit } = await import("../../lib/ratelimit");

  // Fresh key each run so the sliding window starts clean.
  const key = `verify-selftest-${Date.now()}`;
  let allowed = 0;
  let blocked = 0;
  for (let i = 0; i < 7; i++) {
    const r = await rateLimit("verify", key);
    if (r.ok) allowed++;
    else blocked++;
  }

  console.log(`\nUpstash configured: ${configured}`);
  console.log(`verify bucket (5 / 10 min): ${allowed} allowed, ${blocked} blocked of 7`);

  if (configured) {
    const ok = allowed === 5 && blocked === 2;
    console.log(ok ? "PASS  limit engaged (5 allowed, 2 blocked)" : "FAIL  expected 5 allowed / 2 blocked");
    process.exit(ok ? 0 : 1);
  } else {
    const ok = allowed === 7 && blocked === 0;
    console.log(ok ? "PASS  fail-open (all allowed, limiting disabled)" : "FAIL  expected all allowed");
    process.exit(ok ? 0 : 1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
