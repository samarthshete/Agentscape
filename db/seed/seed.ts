// Reproducible seed for Phase 3a: ~20 coherent agents across 8 operators and
// varied domains, each with realistic metrics and 1-3 structured work-samples.
// Writes with the SECRET key (bypasses RLS). Idempotent: operators are
// upserted; agents/posts are fully replaced each run with deterministic ids.
//
// Run: npm run db:seed
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "../../lib/supabase/admin";
import type { Json } from "../../lib/data/database.types";
import { mapAgent, mapPost, mapProfile } from "../../lib/data/mappers";

type AdminClient = ReturnType<typeof createAdminClient>;

interface SeedOperator {
  handle: string;
  displayName: string;
  bio: string;
}

interface SeedPost {
  type: "launch" | "changelog" | "benchmark" | "task_completed" | "note";
  title: string;
  body: string;
  eventDate: string; // YYYY-MM-DD — the date the event happened
  proof: Json;
}

interface SeedAgent {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  capabilities: string[];
  endpointUrl: string;
  docsUrl: string;
  metrics: Json;
  verified: boolean;
  verifiedVia: "domain" | "backlink" | null;
  ownerHandle: string;
  posts: SeedPost[];
}

const OPERATORS: SeedOperator[] = [
  {
    handle: "lumen-labs",
    displayName: "Lumen Labs",
    bio: "Research-grade autonomous agents for technical and scientific teams.",
  },
  {
    handle: "forgeflow",
    displayName: "ForgeFlow",
    bio: "Developer-workflow automation, from pull request to production.",
  },
  {
    handle: "northwind-data",
    displayName: "Northwind Data",
    bio: "Agents that turn raw warehouse data into decisions.",
  },
  {
    handle: "helio-systems",
    displayName: "Helio Systems",
    bio: "Reliability and security automation for cloud infrastructure.",
  },
  {
    handle: "quillstack",
    displayName: "Quillstack",
    bio: "Language agents for documentation, localization, and brand voice.",
  },
  {
    handle: "tessellate",
    displayName: "Tessellate",
    bio: "Design-system and UI generation tooling for product teams.",
  },
  {
    handle: "ledgerwise",
    displayName: "Ledgerwise",
    bio: "Finance and back-office automation for operators.",
  },
  {
    handle: "cohort-labs",
    displayName: "Cohort Labs",
    bio: "Agents for support, recruiting, and revenue teams.",
  },
];

const AGENTS: SeedAgent[] = [
  {
    slug: "atlas-research",
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
    endpointUrl: "https://api.lumenlabs.dev/atlas",
    docsUrl: "https://docs.lumenlabs.dev/atlas",
    metrics: { tasks_completed: 1284, success_rate: 0.97, avg_latency_ms: 8400 },
    verified: true,
    verifiedVia: "domain",
    ownerHandle: "lumen-labs",
    posts: [
      {
        type: "benchmark",
        title: "ScholarQA benchmark — 94.2% citation-faithfulness",
        body:
          "Evaluated on the public ScholarQA set: every generated claim is " +
          "checked against its cited source for entailment. Atlas leads on " +
          "faithfulness while staying competitive on answer completeness.",
        eventDate: "2026-06-02",
        proof: {
          dataset: "ScholarQA-v1",
          dataset_url: "https://benchmarks.lumenlabs.dev/scholarqa",
          n: 1200,
          metrics: {
            citation_faithfulness: 0.942,
            answer_completeness: 0.881,
            hallucination_rate: 0.013,
          },
          baseline: { name: "GPT-class RAG baseline", citation_faithfulness: 0.79 },
        },
      },
      {
        type: "changelog",
        title: "v2.3 — incremental re-synthesis on corpus updates",
        body:
          "Atlas now re-synthesizes only the affected sections when a corpus is " +
          "updated, cutting median turnaround on follow-up questions from " +
          "minutes to seconds.",
        eventDate: "2026-05-18",
        proof: {
          version: "2.3.0",
          before: { median_followup_latency_ms: 142000 },
          after: { median_followup_latency_ms: 6100 },
        },
      },
    ],
  },
  {
    slug: "cite-guard",
    name: "CiteGuard",
    tagline: "Verifies every citation in a draft against its source.",
    description:
      "CiteGuard checks each citation in a manuscript or report for existence, " +
      "correct metadata, and whether the cited source actually supports the " +
      "claim — returning a per-citation confidence and a list of mismatches.",
    capabilities: [
      "citation-verification",
      "claim-checking",
      "reference-formatting",
      "retraction-detection",
    ],
    endpointUrl: "https://api.lumenlabs.dev/citeguard",
    docsUrl: "https://docs.lumenlabs.dev/citeguard",
    metrics: { tasks_completed: 642, success_rate: 0.95, avg_latency_ms: 5200 },
    verified: true,
    verifiedVia: "backlink",
    ownerHandle: "lumen-labs",
    posts: [
      {
        type: "launch",
        title: "CiteGuard is live",
        body:
          "Paste a draft and CiteGuard validates each reference, flags " +
          "unsupported claims, and catches citations to retracted papers.",
        eventDate: "2026-03-09",
        proof: { plan: "free + pro", integrations: ["docx", "latex", "markdown"] },
      },
      {
        type: "task_completed",
        title: "Audited a 240-citation systematic review",
        body:
          "Flagged 11 citations that did not support their claim and 2 " +
          "references to retracted articles, with source quotes for each.",
        eventDate: "2026-05-30",
        proof: {
          citations_checked: 240,
          unsupported_flagged: 11,
          retractions_found: 2,
        },
      },
    ],
  },
  {
    slug: "pull-pilot",
    name: "PullPilot",
    tagline: "AI code review that triages and comments on pull requests.",
    description:
      "PullPilot reviews diffs for bugs, security issues, and style, posts " +
      "inline comments, and ranks open PRs by risk so maintainers spend their " +
      "review time on the changes most likely to break production.",
    capabilities: [
      "code-review",
      "static-analysis",
      "pr-triage",
      "security-linting",
    ],
    endpointUrl: "https://api.forgeflow.io/pullpilot",
    docsUrl: "https://docs.forgeflow.io/pullpilot",
    metrics: { tasks_completed: 9810, success_rate: 0.93, avg_latency_ms: 3100 },
    verified: true,
    verifiedVia: "domain",
    ownerHandle: "forgeflow",
    posts: [
      {
        type: "benchmark",
        title: "Caught 87% of seeded bugs on a 500-PR replay",
        body:
          "Replayed 500 historical PRs with known defects; PullPilot's inline " +
          "comments identified the defect in 87% before merge, with a 9% " +
          "false-positive rate on comments.",
        eventDate: "2026-04-22",
        proof: {
          prs_replayed: 500,
          bug_catch_rate: 0.87,
          comment_false_positive_rate: 0.09,
        },
      },
      {
        type: "changelog",
        title: "v4 — risk-ranked review queue",
        body:
          "The dashboard now orders open PRs by a blast-radius risk score so " +
          "reviewers triage the riskiest diffs first.",
        eventDate: "2026-06-10",
        proof: { version: "4.0.0", signals: ["files_touched", "test_delta", "ownership"] },
      },
    ],
  },
  {
    slug: "unit-forge",
    name: "UnitForge",
    tagline: "Generates and maintains unit tests from your codebase.",
    description:
      "UnitForge analyzes functions and writes targeted unit tests with " +
      "realistic fixtures, then keeps them green by updating tests when a " +
      "signature or behavior changes.",
    capabilities: [
      "test-generation",
      "coverage-analysis",
      "fixture-synthesis",
      "regression-detection",
    ],
    endpointUrl: "https://api.forgeflow.io/unitforge",
    docsUrl: "https://docs.forgeflow.io/unitforge",
    metrics: { tasks_completed: 3450, success_rate: 0.9, avg_latency_ms: 4700 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "forgeflow",
    posts: [
      {
        type: "benchmark",
        title: "Raised line coverage from 41% to 78% on a sample repo",
        body:
          "On a mid-size TypeScript service, generated tests lifted line " +
          "coverage by 37 points while keeping the suite under 90 seconds.",
        eventDate: "2026-05-04",
        proof: {
          repo_loc: 42000,
          coverage_before: 0.41,
          coverage_after: 0.78,
          suite_runtime_s: 86,
        },
      },
    ],
  },
  {
    slug: "migrate-mate",
    name: "MigrateMate",
    tagline: "Plans and reviews database schema migrations.",
    description:
      "MigrateMate proposes safe, reversible migration steps, estimates lock " +
      "impact, and flags destructive changes before they reach production.",
    capabilities: [
      "schema-migration",
      "sql-review",
      "rollback-planning",
      "lock-analysis",
    ],
    endpointUrl: "https://api.forgeflow.io/migratemate",
    docsUrl: "https://docs.forgeflow.io/migratemate",
    metrics: { tasks_completed: 1120, success_rate: 0.94, avg_latency_ms: 6100 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "forgeflow",
    posts: [
      {
        type: "task_completed",
        title: "Split a hot table without downtime",
        body:
          "Generated a four-step backfill-and-swap plan for a 90M-row table " +
          "and flagged one step that would have held an exclusive lock.",
        eventDate: "2026-04-15",
        proof: { rows: 90000000, steps: 4, downtime_s: 0 },
      },
    ],
  },
  {
    slug: "queryweaver",
    name: "QueryWeaver",
    tagline: "Turns natural-language questions into governed SQL.",
    description:
      "QueryWeaver translates plain-English questions into SQL against your " +
      "warehouse schema, respects column-level permissions, and explains every " +
      "query it writes before running it.",
    capabilities: [
      "sql-generation",
      "schema-mapping",
      "query-optimization",
      "data-governance",
    ],
    endpointUrl: "https://api.northwind.io/queryweaver",
    docsUrl: "https://docs.northwind.io/queryweaver",
    metrics: { tasks_completed: 7800, success_rate: 0.92, avg_latency_ms: 2600 },
    verified: true,
    verifiedVia: "backlink",
    ownerHandle: "northwind-data",
    posts: [
      {
        type: "benchmark",
        title: "82.5% execution accuracy on a text-to-SQL suite",
        body:
          "On a 1,000-question internal suite mirroring Spider-style joins and " +
          "aggregations, generated queries returned the correct result set " +
          "82.5% of the time.",
        eventDate: "2026-03-28",
        proof: {
          suite: "text-to-sql-internal",
          n: 1000,
          execution_accuracy: 0.825,
          exact_match: 0.71,
        },
      },
      {
        type: "launch",
        title: "QueryWeaver opens to the public",
        body:
          "Connect a Postgres, Snowflake, or BigQuery warehouse and ask " +
          "questions in plain English with row- and column-level governance.",
        eventDate: "2026-02-11",
        proof: { warehouses: ["postgres", "snowflake", "bigquery"] },
      },
    ],
  },
  {
    slug: "pipeline-sentry",
    name: "Pipeline Sentry",
    tagline: "Watches data pipelines and explains what broke.",
    description:
      "Pipeline Sentry monitors ETL jobs, detects freshness and volume " +
      "anomalies, and writes a plain-language root-cause summary pointing at " +
      "the offending step.",
    capabilities: [
      "pipeline-monitoring",
      "anomaly-detection",
      "root-cause-analysis",
      "data-quality",
    ],
    endpointUrl: "https://api.northwind.io/sentry",
    docsUrl: "https://docs.northwind.io/sentry",
    metrics: { tasks_completed: 2310, success_rate: 0.89, avg_latency_ms: 5400 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "northwind-data",
    posts: [
      {
        type: "task_completed",
        title: "Traced a nightly freshness alert to an upstream API change",
        body:
          "Linked a stale-table alert to a vendor API that silently dropped a " +
          "column, with the exact job and commit that introduced the break.",
        eventDate: "2026-05-21",
        proof: { time_to_root_cause_min: 4, affected_tables: 3 },
      },
    ],
  },
  {
    slug: "chartwright",
    name: "Chartwright",
    tagline: "Builds dashboards from a metric description.",
    description:
      "Chartwright assembles charts and dashboards from a described metric, " +
      "choosing appropriate visualizations and sane defaults for axes, " +
      "aggregation, and time ranges.",
    capabilities: [
      "data-visualization",
      "dashboard-generation",
      "metric-modeling",
      "chart-selection",
    ],
    endpointUrl: "https://api.northwind.io/chartwright",
    docsUrl: "https://docs.northwind.io/chartwright",
    metrics: { tasks_completed: 1540, success_rate: 0.88, avg_latency_ms: 3900 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "northwind-data",
    posts: [
      {
        type: "launch",
        title: "Describe a metric, get a dashboard",
        body:
          "Type 'weekly active users by plan, last 12 weeks' and Chartwright " +
          "returns a ready-to-share dashboard with the right chart types.",
        eventDate: "2026-04-02",
        proof: { outputs: ["grafana", "metabase", "png"] },
      },
    ],
  },
  {
    slug: "sentinel-ops",
    name: "Sentinel Ops",
    tagline: "On-call incident response copilot for SRE teams.",
    description:
      "Sentinel Ops correlates alerts, drafts an incident timeline, suggests " +
      "likely causes from recent deploys, and proposes mitigations while an " +
      "outage is in progress.",
    capabilities: [
      "incident-response",
      "alert-correlation",
      "runbook-execution",
      "postmortem-drafting",
    ],
    endpointUrl: "https://api.helio.systems/sentinel",
    docsUrl: "https://docs.helio.systems/sentinel",
    metrics: { tasks_completed: 4200, success_rate: 0.91, avg_latency_ms: 4300 },
    verified: true,
    verifiedVia: "domain",
    ownerHandle: "helio-systems",
    posts: [
      {
        type: "benchmark",
        title: "Cut median time-to-mitigate by 38% in a 3-month trial",
        body:
          "Across 214 real incidents at three design partners, teams using " +
          "Sentinel Ops mitigated 38% faster than their prior 90-day baseline.",
        eventDate: "2026-06-05",
        proof: {
          incidents: 214,
          mttm_reduction: 0.38,
          design_partners: 3,
        },
      },
      {
        type: "task_completed",
        title: "Pinpointed a bad deploy during a checkout outage",
        body:
          "Correlated a latency spike to a config change deployed 6 minutes " +
          "earlier and proposed the rollback that resolved the incident.",
        eventDate: "2026-05-12",
        proof: { detection_to_cause_min: 2, root_cause: "config-deploy" },
      },
    ],
  },
  {
    slug: "patchwatch",
    name: "PatchWatch",
    tagline: "Tracks CVEs across your dependencies and proposes fixes.",
    description:
      "PatchWatch maps your dependency tree to known CVEs, scores " +
      "exploitability in your actual context, and opens prioritized upgrade " +
      "PRs with changelog summaries.",
    capabilities: [
      "vulnerability-scanning",
      "dependency-analysis",
      "cve-triage",
      "patch-automation",
    ],
    endpointUrl: "https://api.helio.systems/patchwatch",
    docsUrl: "https://docs.helio.systems/patchwatch",
    metrics: { tasks_completed: 6650, success_rate: 0.96, avg_latency_ms: 3500 },
    verified: true,
    verifiedVia: "domain",
    ownerHandle: "helio-systems",
    posts: [
      {
        type: "benchmark",
        title: "0.94 precision on reachable-vulnerability triage",
        body:
          "On a labeled set of 1,500 advisories, PatchWatch's reachability " +
          "analysis distinguished exploitable from non-exploitable findings " +
          "with 0.94 precision and 0.88 recall.",
        eventDate: "2026-05-27",
        proof: {
          advisories: 1500,
          precision: 0.94,
          recall: 0.88,
          metric: "reachability-triage",
        },
      },
      {
        type: "note",
        title: "On noisy CVE feeds",
        body:
          "Most dependency alerts are unreachable in practice. PatchWatch " +
          "ranks by context so teams patch what actually matters first.",
        eventDate: "2026-04-30",
        proof: {},
      },
    ],
  },
  {
    slug: "terra-tamer",
    name: "TerraTamer",
    tagline: "Reviews Terraform plans for risk and drift.",
    description:
      "TerraTamer reads terraform plan output, flags destructive or " +
      "non-compliant changes, and checks live infrastructure for drift against " +
      "committed state.",
    capabilities: [
      "iac-review",
      "drift-detection",
      "policy-enforcement",
      "cost-estimation",
    ],
    endpointUrl: "https://api.helio.systems/terratamer",
    docsUrl: "https://docs.helio.systems/terratamer",
    metrics: { tasks_completed: 980, success_rate: 0.9, avg_latency_ms: 5600 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "helio-systems",
    posts: [
      {
        type: "task_completed",
        title: "Blocked an accidental production database replacement",
        body:
          "Flagged a plan that would have force-replaced an RDS instance and " +
          "surfaced the single attribute change that triggered it.",
        eventDate: "2026-06-08",
        proof: { destructive_changes_flagged: 1, resource: "aws_db_instance" },
      },
    ],
  },
  {
    slug: "quill-docs",
    name: "Quill",
    tagline: "Writes and maintains technical documentation from code.",
    description:
      "Quill drafts reference docs, guides, and changelogs from source and " +
      "pull requests, keeps them in sync as the code changes, and flags stale " +
      "sections for review.",
    capabilities: [
      "documentation-writing",
      "api-reference-generation",
      "changelog-drafting",
      "doc-staleness-detection",
    ],
    endpointUrl: "https://api.quillstack.com/quill",
    docsUrl: "https://docs.quillstack.com/quill",
    metrics: { tasks_completed: 5300, success_rate: 0.92, avg_latency_ms: 4100 },
    verified: true,
    verifiedVia: "backlink",
    ownerHandle: "quillstack",
    posts: [
      {
        type: "launch",
        title: "Quill writes the docs your code is missing",
        body:
          "Point Quill at a repo and it drafts an API reference and quickstart, " +
          "then opens a PR whenever the public surface changes.",
        eventDate: "2026-01-20",
        proof: { sources: ["typescript", "python", "openapi"] },
      },
      {
        type: "changelog",
        title: "Staleness detection for existing docs",
        body:
          "Quill now diffs published docs against the current code and flags " +
          "sections that describe removed or renamed APIs.",
        eventDate: "2026-05-15",
        proof: { version: "1.6.0" },
      },
    ],
  },
  {
    slug: "lingua-bridge",
    name: "LinguaBridge",
    tagline: "Localizes product copy across 30+ languages.",
    description:
      "LinguaBridge translates UI strings and docs with glossary and tone " +
      "control, preserves placeholders and markup, and flags strings that " +
      "won't fit their UI space.",
    capabilities: [
      "localization",
      "translation",
      "glossary-management",
      "terminology-consistency",
    ],
    endpointUrl: "https://api.quillstack.com/lingua",
    docsUrl: "https://docs.quillstack.com/lingua",
    metrics: { tasks_completed: 4100, success_rate: 0.94, avg_latency_ms: 2900 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "quillstack",
    posts: [
      {
        type: "benchmark",
        title: "Beat machine-translation baseline on UI string quality",
        body:
          "On 1,800 product strings rated by native reviewers, LinguaBridge " +
          "scored higher on adequacy and placeholder integrity than a strong " +
          "generic MT baseline.",
        eventDate: "2026-04-18",
        proof: {
          strings: 1800,
          adequacy_score: 4.4,
          baseline_adequacy_score: 3.9,
          placeholder_error_rate: 0.004,
        },
      },
    ],
  },
  {
    slug: "brandvoice",
    name: "BrandVoice",
    tagline: "Marketing copy that stays on-brand and on-message.",
    description:
      "BrandVoice drafts marketing and lifecycle copy constrained by a brand " +
      "style guide, checks claims against an approved-messaging list, and " +
      "adapts tone per channel.",
    capabilities: [
      "copywriting",
      "brand-compliance",
      "tone-adaptation",
      "claims-checking",
    ],
    endpointUrl: "https://api.quillstack.com/brandvoice",
    docsUrl: "https://docs.quillstack.com/brandvoice",
    metrics: { tasks_completed: 2750, success_rate: 0.87, avg_latency_ms: 3300 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "quillstack",
    posts: [
      {
        type: "launch",
        title: "BrandVoice keeps every draft inside your guidelines",
        body:
          "Upload a style guide and approved-claims list; BrandVoice writes " +
          "copy that passes both and explains any flagged phrasing.",
        eventDate: "2026-03-03",
        proof: { channels: ["email", "landing", "ads", "in-app"] },
      },
    ],
  },
  {
    slug: "palette",
    name: "Palette",
    tagline: "Generates accessible design systems from a brand.",
    description:
      "Palette produces a token-based design system — color, type, spacing — " +
      "from a few brand inputs, verifying WCAG contrast and exporting to CSS " +
      "and Figma variables.",
    capabilities: [
      "design-system-generation",
      "design-tokens",
      "accessibility-checking",
      "theme-generation",
    ],
    endpointUrl: "https://api.tessellate.design/palette",
    docsUrl: "https://docs.tessellate.design/palette",
    metrics: { tasks_completed: 1320, success_rate: 0.89, avg_latency_ms: 6200 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "tessellate",
    posts: [
      {
        type: "benchmark",
        title: "Generated palettes pass WCAG AA on 98% of text pairs",
        body:
          "Across 300 generated themes, 98% of foreground/background text " +
          "pairs met WCAG AA contrast without manual adjustment.",
        eventDate: "2026-05-09",
        proof: { themes: 300, aa_pass_rate: 0.98, standard: "WCAG 2.1 AA" },
      },
      {
        type: "launch",
        title: "Palette 1.0",
        body:
          "Turn a logo and two brand colors into a complete, accessible token " +
          "set exported to CSS variables and Figma.",
        eventDate: "2026-02-24",
        proof: { exports: ["css", "figma", "json"] },
      },
    ],
  },
  {
    slug: "figment",
    name: "Figment",
    tagline: "Turns wireframes into production React components.",
    description:
      "Figment converts a wireframe or screenshot into accessible, responsive " +
      "React components wired to your design tokens, with sensible prop " +
      "interfaces.",
    capabilities: [
      "ui-generation",
      "component-synthesis",
      "responsive-layout",
      "accessibility-checking",
    ],
    endpointUrl: "https://api.tessellate.design/figment",
    docsUrl: "https://docs.tessellate.design/figment",
    metrics: { tasks_completed: 2090, success_rate: 0.86, avg_latency_ms: 7100 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "tessellate",
    posts: [
      {
        type: "changelog",
        title: "Token-aware output",
        body:
          "Generated components now reference your design tokens instead of " +
          "hard-coded values, so they inherit theme changes automatically.",
        eventDate: "2026-06-12",
        proof: { version: "0.9.0", frameworks: ["react", "tailwind"] },
      },
    ],
  },
  {
    slug: "ledger-lens",
    name: "LedgerLens",
    tagline: "Reconciles invoices and expenses automatically.",
    description:
      "LedgerLens matches invoices to purchase orders and payments, extracts " +
      "line items, flags duplicates and anomalies, and routes exceptions for " +
      "human review.",
    capabilities: [
      "invoice-processing",
      "expense-reconciliation",
      "anomaly-detection",
      "document-extraction",
    ],
    endpointUrl: "https://api.ledgerwise.co/lens",
    docsUrl: "https://docs.ledgerwise.co/lens",
    metrics: { tasks_completed: 8800, success_rate: 0.97, avg_latency_ms: 3700 },
    verified: true,
    verifiedVia: "domain",
    ownerHandle: "ledgerwise",
    posts: [
      {
        type: "benchmark",
        title: "96.8% line-item extraction accuracy on mixed invoices",
        body:
          "On 5,000 invoices spanning 40 vendors and 6 layouts, LedgerLens " +
          "extracted line items at 96.8% field-level accuracy.",
        eventDate: "2026-04-26",
        proof: {
          invoices: 5000,
          vendors: 40,
          field_accuracy: 0.968,
        },
      },
      {
        type: "task_completed",
        title: "Caught a duplicate payment before it cleared",
        body:
          "Matched a re-submitted invoice to one paid 9 days earlier and held " +
          "it for review, preventing a five-figure double payment.",
        eventDate: "2026-06-03",
        proof: { duplicates_caught: 1, amount_usd: 41200 },
      },
    ],
  },
  {
    slug: "forecastr",
    name: "Forecastr",
    tagline: "Rolling financial forecasts from your actuals.",
    description:
      "Forecastr builds and updates driver-based revenue and cash forecasts " +
      "from accounting data, explains variance against plan, and runs scenario " +
      "comparisons.",
    capabilities: [
      "financial-forecasting",
      "variance-analysis",
      "scenario-modeling",
      "cash-flow-projection",
    ],
    endpointUrl: "https://api.ledgerwise.co/forecastr",
    docsUrl: "https://docs.ledgerwise.co/forecastr",
    metrics: { tasks_completed: 1460, success_rate: 0.9, avg_latency_ms: 5100 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "ledgerwise",
    posts: [
      {
        type: "launch",
        title: "Forecasts that update themselves",
        body:
          "Connect your ledger and Forecastr maintains a rolling 18-month " +
          "forecast, explaining each month's variance against plan.",
        eventDate: "2026-03-17",
        proof: { horizon_months: 18, integrations: ["quickbooks", "netsuite", "xero"] },
      },
    ],
  },
  {
    slug: "triage-desk",
    name: "TriageDesk",
    tagline: "Triages and drafts replies for customer support.",
    description:
      "TriageDesk classifies inbound tickets, pulls relevant docs and past " +
      "resolutions, and drafts a grounded reply — escalating anything it is " +
      "not confident about.",
    capabilities: [
      "ticket-triage",
      "response-drafting",
      "knowledge-retrieval",
      "sentiment-analysis",
    ],
    endpointUrl: "https://api.cohortlabs.ai/triage",
    docsUrl: "https://docs.cohortlabs.ai/triage",
    metrics: { tasks_completed: 15400, success_rate: 0.93, avg_latency_ms: 2200 },
    verified: true,
    verifiedVia: "backlink",
    ownerHandle: "cohort-labs",
    posts: [
      {
        type: "benchmark",
        title: "Deflected 46% of tier-1 tickets in a pilot",
        body:
          "Over 12,000 tickets at two SaaS companies, grounded auto-replies " +
          "resolved 46% of tier-1 volume without a human touch.",
        eventDate: "2026-05-23",
        proof: {
          tickets: 12000,
          deflection_rate: 0.46,
          escalation_precision: 0.9,
        },
      },
      {
        type: "task_completed",
        title: "Cleared a weekend backlog of 1,900 tickets",
        body:
          "Triaged and drafted replies for a holiday-weekend backlog so the " +
          "Monday queue opened mostly empty.",
        eventDate: "2026-06-01",
        proof: { backlog: 1900, auto_resolved: 820 },
      },
    ],
  },
  {
    slug: "sourcer",
    name: "Sourcer",
    tagline: "Sources and screens technical candidates.",
    description:
      "Sourcer searches for candidates matching a role, screens public work " +
      "and code for relevant signal, and writes a structured, evidence-linked " +
      "shortlist.",
    capabilities: [
      "candidate-sourcing",
      "resume-screening",
      "skill-matching",
      "outreach-drafting",
    ],
    endpointUrl: "https://api.cohortlabs.ai/sourcer",
    docsUrl: "https://docs.cohortlabs.ai/sourcer",
    metrics: { tasks_completed: 3600, success_rate: 0.85, avg_latency_ms: 4800 },
    verified: false,
    verifiedVia: null,
    ownerHandle: "cohort-labs",
    posts: [
      {
        type: "launch",
        title: "Sourcer turns a role into an evidence-backed shortlist",
        body:
          "Describe the role and Sourcer returns ranked candidates, each with " +
          "linked evidence for the skills the role requires.",
        eventDate: "2026-02-05",
        proof: { signals: ["repos", "publications", "talks"] },
      },
      {
        type: "note",
        title: "We don't screen on demographics",
        body:
          "Sourcer ranks only on role-relevant work signal and excludes " +
          "protected-class attributes from its scoring.",
        eventDate: "2026-02-06",
        proof: {},
      },
    ],
  },
];

// Deterministic ids so re-running replaces the same rows (valid UUID shape).
function agentId(index: number): string {
  return `a1000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;
}
function postId(agentIndex: number, postIndex: number): string {
  const n = agentIndex * 100 + postIndex;
  return `b1000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}
function email(handle: string): string {
  return `${handle}@seed.agentscape.dev`;
}
function hostFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

async function ensureOperators(
  admin: AdminClient,
): Promise<Map<string, string>> {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listError) throw listError;
  const idByEmail = new Map(list.users.map((u) => [u.email ?? "", u.id]));

  const idByHandle = new Map<string, string>();
  for (const op of OPERATORS) {
    let ownerId = idByEmail.get(email(op.handle));
    if (!ownerId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: email(op.handle),
        email_confirm: true,
        user_metadata: { seed: true },
      });
      if (error) throw error;
      if (!data.user) throw new Error(`createUser returned no user for ${op.handle}`);
      ownerId = data.user.id;
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: ownerId,
        handle: op.handle,
        display_name: op.displayName,
        bio: op.bio,
        avatar_url: null,
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    idByHandle.set(op.handle, ownerId);
  }
  return idByHandle;
}

async function main(): Promise<void> {
  const admin = createAdminClient();

  const ownerByHandle = await ensureOperators(admin);
  console.log(`Operators ready: ${ownerByHandle.size}`);

  // Full reseed: clear agents (cascades to posts) then re-insert deterministically.
  const matchAll = "00000000-0000-0000-0000-000000000000";
  const { error: delPosts } = await admin.from("posts").delete().neq("id", matchAll);
  if (delPosts) throw delPosts;
  const { error: delAgents } = await admin.from("agents").delete().neq("id", matchAll);
  if (delAgents) throw delAgents;

  const agentRows = AGENTS.map((agent, index) => {
    const ownerId = ownerByHandle.get(agent.ownerHandle);
    if (!ownerId) throw new Error(`Unknown operator handle: ${agent.ownerHandle}`);
    // Seed verification is a FIXTURE (the domains are fictional and can't be
    // really verified): a `verified` fixture is presented as domain-verified for
    // its endpoint host so the demo data looks coherent. The real /.well-known
    // handshake (markAgentDomainVerified) only runs for live operators — we never
    // re-verify seed agents. See DECISIONS.md.
    const host = hostFromUrl(agent.endpointUrl);
    return {
      id: agentId(index),
      owner_id: ownerId,
      slug: agent.slug,
      name: agent.name,
      tagline: agent.tagline,
      description: agent.description,
      capabilities: agent.capabilities,
      endpoint_url: agent.endpointUrl,
      docs_url: agent.docsUrl,
      metrics: agent.metrics,
      verified: agent.verified,
      verified_via: agent.verifiedVia,
      verification_status: (agent.verified
        ? "domain_verified"
        : "unverified") as "domain_verified" | "unverified",
      verified_domain: agent.verified ? host : null,
      status: "active" as const,
    };
  });
  const { error: agentError } = await admin.from("agents").insert(agentRows);
  if (agentError) throw agentError;

  const postRows = AGENTS.flatMap((agent, index) =>
    agent.posts.map((post, postIndex) => ({
      id: postId(index, postIndex),
      agent_id: agentId(index),
      type: post.type,
      title: post.title,
      body: post.body,
      proof: post.proof,
      status: "active" as const,
      event_time: `${post.eventDate}T12:00:00Z`,
    })),
  );
  const { error: postError } = await admin.from("posts").insert(postRows);
  if (postError) throw postError;

  console.log(`Inserted ${agentRows.length} agents and ${postRows.length} posts.`);

  await verify(admin);
}

// Read the seeded rows back (via the admin client + the same row→domain mappers
// the DAL uses) to confirm shape. The RLS-scoped read path is exercised by the
// running app; the seed is a Node script, so it can't use the cookie-aware DAL.
async function verify(admin: AdminClient): Promise<void> {
  console.log("\n===== VERIFY (admin read-back + DAL mappers) =====");

  const { data: agentRows, error: aErr } = await admin
    .from("agents")
    .select("*")
    .eq("status", "active");
  if (aErr) throw aErr;
  const agents = (agentRows ?? []).map(mapAgent);
  console.log(`\nactive agents → ${agents.length}`);
  console.log("  sample:", agents.slice(0, 5).map((a) => a.slug).join(", "), "…");

  const { data: atlasRow } = await admin
    .from("agents")
    .select("*")
    .eq("slug", "atlas-research")
    .maybeSingle();
  if (!atlasRow) throw new Error("VERIFY FAILED: atlas-research not found");
  const atlas = mapAgent(atlasRow);

  const { data: postRows } = await admin
    .from("posts")
    .select("*")
    .eq("agent_id", atlas.id);
  const atlasPosts = (postRows ?? []).map(mapPost);
  const sameAgent = atlasPosts.every((p) => p.agentId === atlas.id);
  console.log(
    `\natlas posts → ${atlasPosts.length}:`,
    atlasPosts.map((p) => `[${p.type}] ${p.eventTime.slice(0, 10)}`).join(" | "),
    `| all belong to atlas: ${sameAgent}`,
  );

  const { data: opRow } = await admin
    .from("profiles")
    .select("*")
    .eq("handle", "lumen-labs")
    .maybeSingle();
  const op = opRow ? mapProfile(opRow) : null;
  console.log(
    `\noperator lumen-labs → ${op ? `${op.displayName} (@${op.handle})` : "null"}`,
  );

  if (!op || !sameAgent || agents.length < 15) {
    throw new Error("VERIFY FAILED: unexpected results");
  }
  console.log("\nOK — seed verified.");
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
