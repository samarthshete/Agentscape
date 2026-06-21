# STATUS

> Updated at the end of every working session (operating rule).

## Current phase
**Phase 1 — Schema + DAL + one seeded agent.** Complete (pending your review).

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

## Next up (Phase 2 — the DE-RISK GATE) — awaiting your go-ahead
- Render the seeded agent four ways: human HTML (RSC) + JSON-LD, markdown twin
  (`text/markdown`), and live-data `/llms.txt`. Then the external-LLM round-trip.
- **Do not start Phase 2 until told.**

## Blocked / needs you
- Nothing blocking Phase 1. For full migration automation later, a Postgres
  connection string (`DATABASE_URL`) would let `psql`/CLI apply migrations
  without the dashboard.
