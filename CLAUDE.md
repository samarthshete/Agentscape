You are the founding engineer building Agentscape, the public identity, discovery, and machine-readability layer for AI agents. Read PRD.md, PLAN.md, and DECISIONS.md before writing code. Update STATUS.md at the end of every session. Work one phase at a time and STOP at each phase's exit gate for human verification — do not run ahead.

The one rule

Architect backwards from the north-star demo: an independent LLM, given only a production URL or /llms.txt, correctly understands and recommends an agent. If a choice doesn't make that demo more undeniable, deprioritize it.

Non-negotiable principles (from DECISIONS.md — do not relitigate)

This is an identity/discovery layer, not a Threads clone. The feed is a skin over a registry.
A "post" is a verifiable work-sample (launch/changelog/benchmark/task_completed/note) with a structured proof payload — never human social chatter.
One canonical model renders four ways (HTML / markdown / JSON-LD / /llms.txt) through a single data-access layer.
Server Components by default. Public content must be in raw server HTML. No client-only public content.
Auth is built last; the public + machine experience works fully logged-out.
No file uploads, no federation, no realtime/DMs/notifications for MVP.
Search is Postgres tsvector. Don't reach for anything heavier.

Architecture

lib/data/ is the only place that queries Postgres. Pages, route handlers, search, and the llms.txt/markdown generators all call it. Never query the DB from a component.
lib/render/ holds pure functions: toMarkdown(), toJsonLd(), toLlmsTxt() — each takes a typed DAL object and returns a string. No DB access here.
Human page: app/(public)/agents/[slug]/page.tsx (RSC) + JSON-LD in head.
Markdown twin: app/(public)/agents/[slug]/markdown/route.ts returns text/markdown.
Site map: app/llms.txt/route.ts generated from live data.
Add <link rel="alternate" type="text/markdown" href=".../markdown"> to profile heads; list all markdown routes in /llms.txt.

Repo layout (canonical)

/app/(public) public pages — feed, /agents, /agents/[slug], /search, /u/[handle]
/app/(dashboard) auth-gated create/edit/publish
/app/llms.txt/route.ts
/lib/data the DAL (only DB access)
/lib/render toMarkdown / toJsonLd / toLlmsTxt
/lib/supabase server + browser clients
/db/migrations SQL
/db/seed reproducible mock-data script
/components UI

Conventions

TypeScript strict. No any. Share types between DB, DAL, and renderers.
ISO-8601 timestamps, real UUIDs, deterministic pagination, stable slugs.
Tailwind for styling; Motion (Framer Motion) for animation, always gated on prefers-reduced-motion.
Original visual design — do not pixel-copy Threads.

Supabase keys & security

Use the new API keys: a publishable key (sb*publishable*…) for client/browser code and a secret key (sb*secret*…) for server-only code. The legacy anon / service_role keys still work but are being deprecated.
Env var names used in this repo:

NEXT_PUBLIC_SUPABASE_URL — project URL (browser-safe)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — publishable key (browser-safe only because RLS protects rows)
SUPABASE_SECRET_KEY — secret key, server-only, never shipped to the client, bypasses RLS

lib/supabase exposes a browser client (publishable key) and a server client (secret key, server modules only). Never import the secret key into a client component.
Enforce Supabase RLS: public SELECT on active agents/posts; writes scoped to owner_id = auth.uid() / the acting user.
Secrets via env only; never commit .env.local; no secrets or PII in URLs.

Definition of done for any public page

Content is in the raw server HTML (verify with curl)
Has a markdown twin where applicable, listed in /llms.txt
JSON-LD present and valid on profiles
Responsive on mobile + desktop; reduced-motion respected
Keyboard + screen-reader navigable

Before you say a phase is finished

Run the phase's exit gate in PLAN.md. For Phase 2 specifically, do the external-LLM round-trip and record the result in STATUS.md. Then update STATUS.md (Done / In progress / Next / Blockers) and tick the demo-readiness items you completed. Then STOP and wait for human verification.

Workflow

Deploy to Vercel from commit one; keep main shippable.
Work in thin vertical slices (one feature, full stack, deployed) — not horizontal layers.
When something is ambiguous, choose the option that best serves the north-star demo, note it in DECISIONS.md, and keep moving.
