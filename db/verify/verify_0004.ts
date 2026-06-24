// Phase 5a DB gate: column-privilege lock + admin verify flip. Requires 0004.
//
// Run AFTER applying db/migrations/0004_add_domain_verification.sql:
//   npx tsx db/verify/verify_0004.ts
//
// Proves: authenticated owners can still create/edit agents, but CANNOT set any
// trust column (verification_status / verified_domain / verified) via UPDATE or
// INSERT — only the service-role (admin) client can. Self-cleaning (creates and
// deletes a throwaway user + agents).
import { config } from "dotenv"; config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secret = process.env.SUPABASE_SECRET_KEY!;
const admin = createClient(url, secret, { auth: { persistSession: false } });

const PW = "Test-" + Math.random().toString(36).slice(2) + "!aA1";
const tag = Date.now();
const email = `v4-${tag}@example.com`;
let failed = 0;
const pass = (m: string) => console.log("  PASS  " + m);
const fail = (m: string) => { console.log("  FAIL  " + m); failed++; };

async function main() {
  // Is 0004 applied?
  const probe = await admin.from("agents").select("verification_status").limit(1);
  if (probe.error) {
    console.log("\nMIGRATION 0004 NOT APPLIED (", probe.error.message, ")");
    console.log("Apply db/migrations/0004_add_domain_verification.sql, then re-run.");
    process.exit(0);
  }
  console.log("\n0004 detected. Running gate…\n");

  const { data: u } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  const A = u!.user!.id;
  await admin.from("profiles").upsert({ id: A, handle: `v4_${tag}`, display_name: "V4" });

  const asA = createClient(url, pub, { auth: { persistSession: false } });
  await asA.auth.signInWithPassword({ email, password: PW });

  // 1) Authenticated CREATE still works (INSERT column grant intact).
  const slug = `v4-agent-${tag}`;
  const ins = await asA.from("agents").insert({
    owner_id: A, slug, name: "V4 Agent", capabilities: [], metrics: {}, status: "active",
  }).select("id, verification_token, verification_status").single();
  if (ins.error) { fail("authenticated createAgent broke: " + ins.error.message); process.exit(1); }
  const agentId = ins.data.id as string;
  pass("authenticated can create an agent (INSERT grant intact)");
  if (ins.data.verification_token) pass("verification_token auto-generated (default)");
  else fail("verification_token is empty");
  if (ins.data.verification_status === "unverified") pass("new agent starts 'unverified'");
  else fail("unexpected initial status: " + ins.data.verification_status);

  // 2) Authenticated can update an ALLOWED column.
  const okUpd = await asA.from("agents").update({ tagline: "edited" }).eq("id", agentId).select("id");
  if (!okUpd.error && (okUpd.data?.length ?? 0) === 1) pass("owner can update an allowed column (tagline)");
  else fail("owner could not update tagline: " + (okUpd.error?.message ?? "0 rows"));

  // 3) SECURITY GATE: authenticated CANNOT set the trust columns directly.
  for (const [label, patch] of [
    ["verification_status", { verification_status: "domain_verified" }],
    ["verified_domain", { verified_domain: "evil.example.com" }],
    ["verified (legacy)", { verified: true }],
  ] as const) {
    const r = await asA.from("agents").update(patch as Record<string, unknown>).eq("id", agentId).select("id");
    if (r.error && r.error.code === "42501") pass(`owner CANNOT set ${label} — 42501 (column privilege)`);
    else if (r.error) fail(`owner ${label} blocked but unexpected code ${r.error.code}: ${r.error.message}`);
    else fail(`SECURITY HOLE: owner set ${label} directly`);
  }

  // 4) SECURITY GATE: cannot forge via INSERT either.
  const forge = await asA.from("agents").insert({
    owner_id: A, slug: `v4-forge-${tag}`, name: "Forge", capabilities: [], metrics: {},
    status: "active", verification_status: "domain_verified",
  }).select("id");
  if (forge.error && forge.error.code === "42501") pass("owner CANNOT forge verification_status on INSERT — 42501");
  else if (forge.error) fail("forge blocked but unexpected code " + forge.error.code);
  else { fail("SECURITY HOLE: forged verified agent via INSERT"); await admin.from("agents").delete().eq("id", forge.data![0].id); }

  // 5) Confirm the stored token is still unverified (none of the above leaked).
  const after = await admin.from("agents").select("verification_status").eq("id", agentId).single();
  if (after.data?.verification_status === "unverified") pass("status unchanged after attacks (still 'unverified')");
  else fail("status changed unexpectedly: " + after.data?.verification_status);

  // 6) Admin verify path flips the badge (simulates the action's final step).
  const flip = await admin.from("agents")
    .update({ verification_status: "domain_verified", verified_domain: "agent.example.com" })
    .eq("id", agentId).select("verification_status, verified_domain").single();
  if (!flip.error && flip.data.verification_status === "domain_verified" && flip.data.verified_domain === "agent.example.com")
    pass("admin (service_role) flips to domain_verified + verified_domain");
  else fail("admin flip failed: " + (flip.error?.message ?? JSON.stringify(flip.data)));

  // cleanup
  await admin.from("agents").delete().eq("owner_id", A);
  await admin.from("profiles").delete().eq("id", A);
  await admin.auth.admin.deleteUser(A);
  console.log(failed === 0 ? "\nALL DB GATE CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
