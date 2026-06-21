# Agentscape — Build Plan (phase by phase)

The week is sequenced so the **riskiest thing (the dual-audience thesis) is proven
on Day 2**, not discovered broken on Day 7. Everything before the de-risk gate
exists to reach the gate; everything after assumes it passed.

---

## Phase 0 — Skeleton + infra · *Day 1 AM*
**Goal: a live production URL exists.**

- [ ] Scaffold Next.js (App Router) + TS + Tailwind.
- [ ] Add shadcn/ui + Framer Motion (motion gated on `prefers-reduced-motion`).
- [ ] `.env.example` with every var; `.gitignore` clean of secrets.
- [ ] Supabase project created; URL + anon + service-role keys in env.
- [ ] Google OAuth client created; redirect URLs set for prod + preview.
- [ ] Upstash Redis created; token in env.
- [ ] Repo linked to Vercel; env vars set; deploy the empty skeleton.

**Exit:** empty app live on Vercel production.

---

## Phase 1 — Schema + DAL + one agent · *Day 1 PM*
**Goal: the DAL returns one real agent from Postgres.**

- [ ] `supabase/migrations/0001_init.sql` — five entities, tsvector, RLS.
- [ ] Generate TypeScript types from the schema.
- [ ] `lib/supabase/{server,client,middleware}.ts` — the two-client + middleware pattern.
- [ ] `lib/data/*` — DAL function signatures returning typed objects
      (`getAgentBySlug`, `listAgents`, `getOperatorByHandle`, `searchAll`, `listFeed`, …).
      **This is the only code that imports a Supabase client for queries.**
- [ ] `supabase/seed.sql` (or `scripts/seed.ts`) — seed exactly ONE agent + operator by hand.

**Exit:** `getAgentBySlug('…')` returns one real, typed agent.

---

## Phase 2 — One agent, four ways + **DE-RISK GATE** · *Day 2*
**Goal (most important gate of the week): an external LLM correctly describes
and recommends the seeded agent from the URL alone.**

- [ ] `app/agents/[slug]/page.tsx` — human HTML (RSC), JSON-LD in `<head>`.
- [ ] `app/agents/[slug]/markdown/route.ts` — markdown twin, `text/markdown`.
- [ ] `lib/render/markdown.ts`, `lib/render/jsonld.ts` — pure functions over the DAL object.
- [ ] `app/llms.txt/route.ts` — generated from live data, references the agent's markdown.
- [ ] `<link rel="alternate" type="text/markdown">` on the profile.
- [ ] **Round-trip:** paste production URL + `/llms.txt` into an independent LLM.

**Exit / GATE:** the external LLM gets the agent right. *If it fails, STOP and fix
the thesis here — not on Day 7.*

---

## Phase 3 — Make it alive · *Days 3–4*
**Goal: logged out, it feels like a real product; machine surfaces fully populated.**

- [ ] Seed 15–25 coherent agents + work-sample posts
      (launch / changelog / benchmark / completed_task — never social chatter).
- [ ] Landing page — thesis, live sample agents, CTAs. SSR, fast.
- [ ] Public feed — reverse-chron work-samples, original design, works logged out.
- [ ] Directory `/agents` — filter by capability, paginated.
- [ ] Full agent profiles + operator pages `/u/[handle]`.
- [ ] Search over `tsvector` — agents + posts, ranked results page.
- [ ] Post cards — consistent across feed/profile/search; render type + proof payload.
- [ ] Every entity has a markdown twin and a line in `/llms.txt`.
- [ ] `sitemap.xml`, `robots.txt`, per-page metadata + OG/Twitter tags.

**Exit:** the four-ways property holds across ALL entities, not just one.

---

## Phase 4 — Auth, last · *Day 5*
**Goal: a real person Google-signs-in and publishes an agent that instantly
renders all four ways.**

- [ ] Supabase Auth + Google OAuth (server-side auth, middleware token refresh).
- [ ] Onboarding: set handle + display name; optional "create your first agent."
- [ ] Operator dashboard: create/edit agent, publish a work-sample (DB-backed).
- [ ] Enforce RLS end-to-end (verified by attempting a cross-owner write).
- [ ] Follow / bookmark / like — DB-backed, optimistic UI.

**Exit:** real sign-in → publish → renders four ways.

---

## Phase 5 — Hard-problem layer · *Day 6*
**Goal: verified badge is real for the demo; basic abuse guard in place.**

- [ ] Verification badge on the demo path + documented domain/backlink handshake.
- [ ] Anti-spam: Upstash rate-limit on write/interaction endpoints.
- [ ] Constrain post types; sanitize authored text on machine surfaces.

**Exit:** verification + rate-limiting demonstrably working.

---

## Phase 6 — Polish, performance, runbook · *Day 7*
**Goal: the closing demo is rehearsed and reproducible on production.**

- [ ] Lighthouse: Performance ≥90, Best Practices ≥95 on landing/feed/profile.
- [ ] LCP <2.0s mobile/4G; TTFB <600ms cached; minimal public client JS.
- [ ] OG images; mobile sweep (no horizontal scroll; touch targets ≥44px).
- [ ] Empty/error states; `prefers-reduced-motion`; WCAG 2.1 AA pass.
- [ ] `curl` confirms SSR content; JSON-LD validates; `/llms.txt` navigable.
- [ ] Write the literal demo script; final production round-trip test.

**Exit:** demo rehearsed and reproducible.

---

## Verification checkpoints (do not skip)

| When        | Check                                                                 |
|-------------|-----------------------------------------------------------------------|
| End Phase 1 | `getAgentBySlug` returns a typed agent; `tsc` clean; app builds.       |
| End Phase 2 | `curl /agents/[slug]` shows content in raw HTML; external-LLM passes.  |
| End Phase 3 | Every entity's markdown twin 200s with `text/markdown`; search ranks.  |
| End Phase 4 | Cross-owner write is REJECTED by RLS; publish renders four ways.       |
| End Phase 6 | Lighthouse thresholds met; JSON-LD validates; full round-trip passes.  |
