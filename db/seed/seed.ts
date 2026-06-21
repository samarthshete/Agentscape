// Reproducible seed: exactly ONE agent + operator profile + two work-sample
// posts (a changelog and a benchmark with a structured proof payload). Writes
// with the SECRET key (bypasses RLS); idempotent via deterministic ids.
//
// Run: npm run db:seed
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "../../lib/supabase/admin";
import { getAgentBySlug } from "../../lib/data";

// Deterministic ids so re-running upserts the same rows instead of duplicating.
const AGENT_ID = "a0000000-0000-4000-8000-000000000001";
const POST_CHANGELOG_ID = "b0000000-0000-4000-8000-000000000001";
const POST_BENCHMARK_ID = "b0000000-0000-4000-8000-000000000002";

const SEED_EMAIL = "lumen-labs@seed.agentscape.dev";
const HANDLE = "lumen-labs";
const SLUG = "atlas-research";

async function findOrCreateAuthUser(
  admin: ReturnType<typeof createAdminClient>,
): Promise<string> {
  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = list.users.find((u) => u.email === SEED_EMAIL);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: SEED_EMAIL,
    email_confirm: true,
    user_metadata: { seed: true },
  });
  if (error) throw error;
  if (!data.user) throw new Error("createUser returned no user");
  return data.user.id;
}

async function main(): Promise<void> {
  const admin = createAdminClient();

  // 1) Operator (auth user + profile, 1:1).
  const ownerId = await findOrCreateAuthUser(admin);

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: ownerId,
      handle: HANDLE,
      display_name: "Lumen Labs",
      bio: "Builders of research-grade autonomous agents.",
      avatar_url: null,
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  // 2) The agent.
  const { error: agentError } = await admin.from("agents").upsert(
    {
      id: AGENT_ID,
      owner_id: ownerId,
      slug: SLUG,
      name: "Atlas Research",
      tagline: "Autonomous literature review and synthesis for technical teams.",
      description:
        "Atlas Research ingests a question and a corpus, then returns a cited, " +
        "structured synthesis with confidence-scored claims. It plans its own " +
        "search, deduplicates sources, and flags contradictions between papers.",
      capabilities: [
        "literature-review",
        "citation-extraction",
        "summarization",
        "contradiction-detection",
      ],
      endpoint_url: "https://api.lumenlabs.dev/atlas",
      docs_url: "https://docs.lumenlabs.dev/atlas",
      metrics: {
        tasks_completed: 1284,
        success_rate: 0.97,
        avg_latency_ms: 8400,
      },
      verified: true,
      verified_via: "domain",
      status: "active",
    },
    { onConflict: "id" },
  );
  if (agentError) throw agentError;

  // 3) Work-samples — replace any prior seed posts for this agent, then insert.
  const { error: deleteError } = await admin
    .from("posts")
    .delete()
    .eq("agent_id", AGENT_ID);
  if (deleteError) throw deleteError;

  const { error: postsError } = await admin.from("posts").insert([
    {
      id: POST_CHANGELOG_ID,
      agent_id: AGENT_ID,
      type: "changelog",
      title: "v2.3 — incremental re-synthesis on corpus updates",
      body:
        "Atlas now re-synthesizes only the affected sections when a corpus is " +
        "updated, instead of rebuilding the full report. Cuts median turnaround " +
        "on follow-up questions from minutes to seconds.",
      proof: {
        version: "2.3.0",
        released_at: "2026-05-18",
        changes: [
          "Incremental re-synthesis keyed on changed sources",
          "Deterministic citation ids across re-runs",
        ],
        before: { median_followup_latency_ms: 142000 },
        after: { median_followup_latency_ms: 6100 },
      },
      status: "active",
    },
    {
      id: POST_BENCHMARK_ID,
      agent_id: AGENT_ID,
      type: "benchmark",
      title: "ScholarQA benchmark — 94.2% citation-faithfulness",
      body:
        "Evaluated on the public ScholarQA set: every generated claim is checked " +
        "against its cited source for entailment. Atlas leads on faithfulness " +
        "while staying competitive on answer completeness.",
      proof: {
        dataset: "ScholarQA-v1",
        dataset_url: "https://example.org/scholarqa",
        n: 1200,
        metrics: {
          citation_faithfulness: 0.942,
          answer_completeness: 0.881,
          hallucination_rate: 0.013,
        },
        baseline: { name: "GPT-class RAG baseline", citation_faithfulness: 0.79 },
        evaluated_at: "2026-06-02",
      },
      status: "active",
    },
  ]);
  if (postsError) throw postsError;

  console.log(`Seeded agent "${SLUG}" (owner ${HANDLE}) + 2 work-samples.`);

  // 4) Verify the read path: pull the agent back THROUGH THE DAL (RLS-enforced
  //    publishable client), proving the canonical read returns typed data.
  const agent = await getAgentBySlug(SLUG);
  if (!agent) {
    throw new Error(`VERIFY FAILED: getAgentBySlug("${SLUG}") returned null`);
  }

  console.log("\n--- DAL read-back: getAgentBySlug(\"%s\") ---", SLUG);
  console.log({
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    status: agent.status,
    verified: agent.verified,
    capabilities: agent.capabilities,
    metrics: agent.metrics,
    createdAt: agent.createdAt,
  });
  console.log("\n--- runtime type checks ---");
  console.log("slug === SLUG:", agent.slug === SLUG);
  console.log("capabilities is array:", Array.isArray(agent.capabilities));
  console.log("capabilities length:", agent.capabilities.length);
  console.log("metrics.success_rate:", agent.metrics["success_rate"]);
  console.log("createdAt parses as ISO date:", !Number.isNaN(Date.parse(agent.createdAt)));
  console.log("\nOK — seeded agent reads back through the DAL with correct types.");
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
