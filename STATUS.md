# STATUS

> Updated at the end of every working session (operating rule).

## Current phase
**Phase 2 — One agent, four ways.** Renderings complete; **awaiting the human
external-LLM round-trip (the de-risk GATE) before Phase 3.**

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

## Next up (Phase 3) — only after the gate passes
- Seed 15–25 coherent agents + work-samples; landing page, public feed,
  directory `/agents`, operator pages, `tsvector` search, sitemap/robots.
- **Do not start Phase 3 until the human confirms the de-risk gate passed.**

## Blocked / needs you
- **The external-LLM de-risk gate** (above) — you run it against production.
- For full migration automation later, a Postgres connection string
  (`DATABASE_URL`) would let `psql`/CLI apply migrations without the dashboard.
