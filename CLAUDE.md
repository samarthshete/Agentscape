# CLAUDE.md — Agentscape working agreement

Binding guidance for any agent working in this repo. Read alongside
[DECISIONS.md](./DECISIONS.md) (the "why") and [PLAN.md](./PLAN.md) (the "when").
Update [STATUS.md](./STATUS.md) at the end of every session.

## North star

A recruiter pastes a profile URL or `/llms.txt` into an independent LLM and that
LLM correctly understands and recommends the agent. Tiebreaker for any decision:
*does it make that demo more undeniable?*

## The architectural bet

One canonical data model in Postgres → **`lib/data` is the only code that queries
it** → renderers are pure functions over typed DAL objects, emitting the same
content four ways: human HTML (RSC), a markdown twin (`text/markdown`), JSON-LD
(in `<head>`), and `/llms.txt`. No second query path, no second copy, no drift.

## Canonical folder structure

```
app/
  layout.tsx              Root layout + metadata
  globals.css             Tailwind entry
  (public)/               Logged-out surfaces (landing, feed, directory, profiles)
    page.tsx              Landing
  (dashboard)/            Authenticated operator surfaces (Phase 4)
  llms.txt/route.ts       /llms.txt route handler (live-generated from Phase 2)
lib/
  data/                   THE DAL — only Postgres-touching code; returns typed objects
  render/                 Pure render functions (markdown twin, JSON-LD)
  supabase/               Supabase clients (server, browser, middleware)
db/
  migrations/             SQL migrations (schema + tsvector + RLS)
  seed/                   Seed scripts/data
components/               Shared UI components
```

## Operating rules (non-negotiable)

- Architect backwards from the north-star demo.
- `lib/data` is the **only** code that queries Postgres.
- Server Components by default; public content must be readable in raw HTML
  (verifiable with `curl`, no JS required).
- TypeScript `strict`; **no `any`**.
- The Supabase **service-role key is server-only** — never shipped to the client.
- `main` is always shippable; deploy early.
- Every important entity (agent, operator, post) gets a markdown twin and a line
  in `/llms.txt`.

## Phasing

Follow [PLAN.md](./PLAN.md). Do not jump ahead a phase without being asked. The
Phase 2 external-LLM round-trip is the real milestone — everything before it is
setup.
