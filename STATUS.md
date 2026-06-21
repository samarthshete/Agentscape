# STATUS

> Updated at the end of every working session (operating rule).

## Current phase
**Phase 3b-i — Design system + component library + profile restyle. Complete
(pending your review).** Phase 2 de-risk gate: **PASSED (2026-06-21)**.
Next is **3b-ii** (landing/feed/directory/search/operator pages) — not started.

## Phase 3b-i — Done (built to the Claude Design handoff)
- **Theme** (`app/globals.css` + `tailwind.config.ts`): handoff tokens as CSS
  vars → Tailwind. Dark = primary canvas, light = full parity. Accent = GREEN
  (#34E29B dark / #047A4A light) — supersedes violet (see DECISIONS.md §13).
- **Fonts:** Geist Sans + Geist Mono via the `geist` package (mono for all
  numbers/ids/endpoints/proof). **Theme toggle** + pre-paint inline script that
  respects `prefers-color-scheme` and a stored override.
- **Component library** (`/components`, presentational, typed from DAL domain
  types, no DB): TopNav, WorkSampleCard, AgentCard, ProfileHeader,
  VerificationBadge (pill + compact), CapabilityTag, MetricStat, TypeBadge,
  Button (primary/secondary/text), SearchBar (with "/" shortcut). Client islands:
  ThemeToggle, SearchBar, CopyButton. Pure formatters in `components/format.ts`.
- **Restyled `/agents/[slug]`** to ProfileHeader + WorkSampleCard. Human HTML
  only — markdown twin and JSON-LD untouched. Content stays in raw server HTML
  (RSC); interactivity is thin islands.
- **A11y/motion:** focus-visible accent outline, keyboard-navigable, AA-checked
  green CTA (dark text on #34E29B; white on #047A4A), reduced-motion guard.

## Phase 3b-i — Verification (local)
- `curl /agents/atlas-research` → all content (name, tagline, capabilities,
  metrics 97.0/1,284, ScholarQA proof 0.942, operator "Lumen Labs") in raw HTML.
- Markdown twin still `text/markdown`, unchanged; JSON-LD still valid
  (`SoftwareApplication`, author Lumen Labs).
- Second agent (`sentinel-ops`) renders. Responsive markers present (flex-wrap,
  sm:/md: breakpoints). `npm run typecheck` exit 0; `npm run build` exit 0.

## NOT in 3b-i (deferred to 3b-ii)
- No new pages: landing (still placeholder), feed, `/agents` directory, `/search`,
  `/u/[handle]`. TopNav links to those routes 404 until 3b-ii builds them.

## Phase 3a — freshness fix (2026-06-21)
- **Reported:** production `/llms.txt` appeared to show 1 agent while the DB had
  20. **Finding:** the route was already `force-dynamic` (since Phase 2) and
  production was in fact serving all 20 — the "1 agent" was the pre-3a-seed
  state briefly served from an edge node, not a build-time freeze.
- **Hardening:** added explicit `Cache-Control: no-store` to `/llms.txt` so no
  CDN/proxy can ever serve a frozen machine index (its prior
  `public, max-age=0, must-revalidate` technically permitted shared-cache
  storage). Entity routes (`/agents/[slug]`, `/markdown`) confirmed live.
- **Policy recorded in DECISIONS.md §12:** every DB-listing route must be
  `force-dynamic` (machine index also `no-store`); never `force-static` on a
  DB-backed route. 3b's feed/directory/search inherit this.

## Phase 3a — Done
- **DAL** (`lib/data`): added `getPostsByAgent(agentId,{limit?,offset?})` (replaces
  the Phase-2 `getFeed`-filter workaround), `getProfileByHandle`, `getProfileById`.
  `getFeed`/`getPostsByAgent` now order by `event_time` desc. Kept
  `listAgents`/`getFeed`/`searchAgents`. DAL remains the only DB access.
- **Schema** `db/migrations/0002_add_post_event_time.sql` (additive, idempotent):
  `posts.event_time timestamptz` + index. Applied to Supabase.
- **Renderers**: `toJsonLd` now includes the operator as `author`/`Person` (the
  Phase-2 deferral) and uses `event_time` for `datePublished`; `toMarkdown` adds
  an operator line + per-post date; profile page shows the operator and displays
  `event_time` (not `created_at`). Renderers stay pure.
- **/llms.txt** lists ALL active agents via `listAgents({limit:1000})`.
- **Seed** (`db/seed/seed.ts`, idempotent full reseed): 8 operators, **20 agents**
  across research/devtools/data/infra-security/content/design/finance/support, a
  mix of verified/unverified, **31 work-samples** with structured proof + event
  times. Fixed the Phase-2 `example.org` proof link to a branded URL.

## Phase 3a — Verification (this session)
- `npm run db:seed` → 8 operators, 20 agents, 31 posts; DAL read-backs:
  - `listAgents({limit:1000})` → 20 active agents.
  - `searchAgents("sql")` → migrate-mate, queryweaver; `searchAgents("incident
    response")` → sentinel-ops (sensible hits).
  - `getPostsByAgent(atlas)` → 2 posts, all scoped to atlas.
  - `getProfileByHandle("lumen-labs")` → Lumen Labs.
- `curl /llms.txt` → 20 agent entries, each with a markdown link.
- Spot-check `queryweaver`: profile (HTML, shows operator), JSON-LD
  (`author` Person + `datePublished` from event_time), markdown twin (operator
  line + per-post dates). All HTTP 200.
- `npm run typecheck` exit 0; `npm run build` exit 0.

## NOT in 3a (deliberately deferred to 3b)
- No human list-view UI yet: landing/feed/directory `/agents`/search/`/u/[handle]`.
  The operator `/u/[handle]` links in JSON-LD/markdown point at pages 3b will add.

## De-risk gate result (2026-06-21) — PASSED
Run by the human against production (https://agentscape-kappa.vercel.app) with
two independent LLMs, **Gemini** and **ChatGPT**, in fresh sessions.

- **Both** correctly identified Atlas Research as an autonomous literature-
  review/synthesis agent, listed all four capabilities, and read both the
  operational metrics (97% success, 1,284 tasks, 8.4s) and the structured proof
  payloads — the ScholarQA benchmark (94.2% citation-faithfulness, 1.3%
  hallucination, vs 79% baseline) and the v2.3 changelog (142,000ms → 6,100ms).
- **Both recommended Atlas Research** for the recruiter-scenario task, citing
  specifics. → The four-ways machine-readability thesis holds.
- **Useful critique (ChatGPT):** the benchmark proof is self-reported on the
  page and `dataset_url` is a placeholder (`example.org`); "Verified (domain)"
  is domain-only, not a performance audit. Not a gate failure — but a Phase 3
  to-do: use realistic proof links and keep claimed-vs-verified clearly labeled.

## Phase 2 — Done
- **Human profile** `app/(public)/agents/[slug]/page.tsx` (RSC, `force-dynamic`):
  name, tagline, verification badge, description, capabilities, metrics, and the
  agent's work-sample posts (with proof). All content is in the **raw server
  HTML** (curl-verified, no client JS).
- **JSON-LD** `lib/render/toJsonLd.ts` → `SoftwareApplication` (+ metrics as
  `additionalProperty`, capabilities as `featureList`, posts as `TechArticle`
  under `subjectOf`). Emitted in the page's raw HTML; valid JSON. (Rendered as a
  body `<script>`, not literally in `<head>` — see DECISIONS.md §11.)
- **Markdown twin** `app/(public)/agents/[slug]/markdown/route.ts` via
  `lib/render/toMarkdown.ts` → `text/markdown`. `<link rel="alternate"
  type="text/markdown">` added to the page `<head>` via the Metadata API.
- **/llms.txt** now generated from **live data** (`listAgents()` →
  `lib/render/toLlmsTxt.ts`): site purpose + the agent's profile and markdown
  links. Replaces the Phase 0 stub.
- Renderers in `lib/render` are **pure** (typed DAL object in, string/object
  out); no DB access. All reads go through the existing DAL.

## Phase 2 — Verification (local, this session)
- `curl /agents/atlas-research` → HTTP 200 `text/html`; "Atlas Research",
  tagline, capabilities, benchmark/changelog all present in raw HTML.
- `curl /agents/atlas-research/markdown` → HTTP 200 `text/markdown`; full twin
  with metrics + both work-samples and proof payloads.
- `curl /llms.txt` → HTTP 200 `text/plain`; lists the agent + its markdown route.
- JSON-LD present in page source and parses as valid `SoftwareApplication`.
- 404 path: unknown slug → page 404, markdown route 404.
- `npm run typecheck` exit 0; `npm run build` exit 0 (routes are dynamic ƒ).

## Phase 2 — In progress / blocked on you
- **THE DE-RISK GATE (not yet run):** paste the deployed profile URL +
  `/llms.txt` into an independent LLM and confirm it correctly understands and
  recommends Atlas Research. Per your instruction, **you run this**, not me. I'll
  record the result here once you report it. *If it fails, we fix the thesis here
  — not in a later phase.*
- Code is committed and pushed so Vercel deploys for the gate (prod:
  https://agentscape-kappa.vercel.app/).

## Known limitations carried into Phase 3 (see DECISIONS.md §11)
- Posts fetched via `getFeed()` filtered by agent — add a dedicated
  `getPostsByAgent` DAL function when the feed/directory land.
- Operator (author) not yet in the JSON-LD — needs an operator-profile DAL read.

## Security patches
- **2026-06-21 — Next.js 15.0.3 → 15.0.5** (exact-pinned), patching
  **CVE-2025-66478** (reported critical RCE in RSC / App Router). Standalone
  commit; `typecheck` + `build` pass on 15.0.5. See DECISIONS.md §10.

## Done (this session)
- **Supabase clients** (`lib/supabase/`): `client.ts` (browser, publishable key),
  `server.ts` (server DAL reads, publishable key, RLS-enforced), `admin.ts`
  (secret key, `server-only`-guarded, RLS-bypassing — seed/trusted writes only).
- **Migration** `db/migrations/0001_init.sql`: `profiles`, `agents`, `posts`,
  `follows`, `bookmarks`, `likes`; 4 enums; tsvector search columns (maintained
  by triggers — see note); GIN indexes on search, btree on FKs + feed keys,
  UNIQUE on `agents.slug` / `profiles.handle`; `updated_at` trigger; full RLS
  (public SELECT on active agents/posts; owner-scoped writes; self-only
  interactions). **Applied to the Supabase project.**
- **Types** (`lib/data/database.types.ts` row types + `types.ts` domain types +
  `mappers.ts`): shared DB ↔ DAL vocabulary, snake→camel mapping. No `any`.
- **DAL** (`lib/data/index.ts`) — the only Postgres-touching code:
  - `getAgentBySlug(slug): Promise<Agent | null>`
  - `listAgents({limit?, offset?}): Promise<Agent[]>`
  - `getFeed({limit?, offset?}): Promise<Post[]>`
  - `searchAgents(query, {limit?, offset?}): Promise<Agent[]>`
- **Seed** (`db/seed/seed.ts`, `npm run db:seed`): provisions one operator
  (auth user + `profiles`), one agent (`atlas-research`), and two work-samples
  (a `changelog` + a `benchmark` with structured `proof` payloads). Idempotent
  via deterministic ids + upserts.

## Verification (this session)
- `npm run db:seed` → seeds, then reads the agent back **through the DAL**
  (`getAgentBySlug`, RLS-enforced publishable client) and prints the typed
  object: correct `capabilities` array (4), `metrics` object, ISO `createdAt`.
  Re-running yields the same row (idempotent, no duplication).
- `npm run typecheck` → exit 0 (strict, no `any`).
- `npm run build` → ✓ compiled; `/` and `/llms.txt` prerender. `main` shippable.

## Decisions recorded (DECISIONS.md §9)
- Human table named **`profiles`** (not `operators`); `posts.type` enum includes
  `task_completed` + `note` per CLAUDE.md.
- `profiles.id` → `auth.users(id)`; seed provisions an auth user so RLS by
  `auth.uid()` is real.
- DAL reads use the **publishable** key (RLS enforced); secret key reserved for
  seed/trusted server actions.
- DB types hand-authored to match the migration (regenerate via CLI later).

## Notes / gotchas for next session
- **tsvector via triggers, not generated columns.** A `STORED GENERATED` column
  rejected the search expression as "not immutable"; a `BEFORE INSERT/UPDATE`
  trigger maintains `search_vector` instead. Same column/index/DAL.
- **Seed runs under `--conditions=react-server`** (wired into `npm run db:seed`)
  so the `server-only` guard is a no-op in Node, exactly as in a Server Component.
- **node_modules on this machine is flaky** — Next's `dist/compiled` files have
  been dropped twice now, breaking `next build` with MODULE_NOT_FOUND. Fix is a
  clean `rm -rf node_modules && npm install`. Not a code defect.

## Next up (Phase 3b) — after you verify the 3a data
- Human list-view UI over the now-populated data: landing page, public feed,
  directory `/agents` (filter by capability, paginated), operator pages
  `/u/[handle]`, search results page over `tsvector`, post cards; sitemap/robots.
- **Do not start 3b until you confirm the seed data looks right.**

## Blocked / needs you
- Your review of the 3a seed data (live: https://agentscape-kappa.vercel.app).
- For full migration automation later, a Postgres connection string
  (`DATABASE_URL`) would let `psql`/CLI apply migrations without the dashboard.
