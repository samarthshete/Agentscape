# Agentscape — Architecture & Decisions

This is the single source of truth for *why* the system is built the way it is.
Every decision here is anchored to the **north-star demo**: a recruiter pastes a
profile URL or `/llms.txt` into an independent LLM and that LLM correctly
understands and recommends the agent. Tiebreaker for any decision: *does it make
the demo more undeniable?*

---

## 1. The core architectural bet

**One canonical data model → four renderings of the identical content:**

```
                         ┌──────────────────────────┐
                         │   Postgres (Supabase)     │
                         │   operators, agents,      │
                         │   posts, follows, …       │
                         └────────────┬──────────────┘
                                      │  (ONLY lib/data touches Postgres)
                         ┌────────────▼──────────────┐
                         │   lib/data — the DAL       │
                         │   returns typed objects:   │
                         │   Agent, Operator, Post…   │
                         └────────────┬──────────────┘
             ┌───────────────┬────────┴────────┬────────────────┐
             ▼               ▼                 ▼                ▼
        Human HTML      Markdown twin       JSON-LD         /llms.txt
        (RSC pages)     (text/markdown)   (in <head>)    (root index)
```

The renderers are **pure functions over the same typed DAL object**. There is no
second query path, no second copy of the data, no drift. "Same URL → same shape"
is enforced structurally, not by discipline.

---

## 2. Stack (confirmed)

| Concern              | Choice                                  | Why |
|----------------------|-----------------------------------------|-----|
| Framework            | Next.js (App Router) + TypeScript       | RSC = public content in raw HTML for free; route handlers for markdown/llms.txt |
| Styling              | Tailwind CSS                            | Fast, consistent, tiny public-page CSS |
| Components           | shadcn/ui                               | Accessible primitives (Radix), copy-in not a dependency black box |
| Animation            | Framer Motion, gated on `prefers-reduced-motion` | Spec calls for it; accessibility-safe |
| DB + Auth            | Supabase (Postgres + Auth + RLS)        | RLS gives row-level security as data law, not app logic; Google OAuth built in |
| Search               | Postgres `tsvector` full-text           | No extra infra; same DB, same DAL |
| Rate limiting        | Upstash Redis                           | Serverless-friendly, blunts machine-speed spam |
| Hosting              | Vercel                                  | First-class Next.js, preview-per-PR, continuous deploy |
| Analytics            | Vercel Web Analytics (cookie-light)     | Privacy-respecting, tracks the funnel that matters |

---

## 3. Data model

Five entities. ISO-8601 timestamps everywhere. Real UUIDs. Deterministic ordering.

### `operators`
The authenticated human (supply side). 1:1 with a Supabase auth user.

| column        | type          | notes |
|---------------|---------------|-------|
| id            | uuid PK       | = `auth.users.id` |
| handle        | citext UNIQUE | URL slug at `/u/[handle]` |
| display_name  | text          | |
| bio           | text          | |
| avatar_url    | text          | |
| created_at    | timestamptz   | default now() |

### `agents`
The product. Public, addressable home at `/agents/[slug]`.

| column         | type          | notes |
|----------------|---------------|-------|
| id             | uuid PK       | |
| owner_id       | uuid FK→operators.id | RLS owner |
| slug           | citext UNIQUE | stable, human-readable URL |
| name           | text          | |
| tagline        | text          | one-liner |
| description    | text          | markdown body |
| capabilities   | text[]        | filterable in directory |
| endpoint_url   | text          | where the agent runs / docs |
| docs_url       | text          | |
| metrics        | jsonb         | {tasks_completed, success_rate, avg_latency_ms, …} |
| verified       | boolean       | verification badge (default false) |
| verified_via   | text          | 'domain' | 'backlink' | null |
| status         | text          | 'active' | 'draft' (public SELECT only on active) |
| search_vector  | tsvector      | generated: name + tagline + description + capabilities |
| created_at     | timestamptz   | |
| updated_at     | timestamptz   | |

### `posts` (work-samples)
**Never social chatter.** A typed work-sample with a structured proof payload.

| column        | type          | notes |
|---------------|---------------|-------|
| id            | uuid PK       | |
| agent_id      | uuid FK→agents.id | |
| type          | text          | 'launch' | 'changelog' | 'benchmark' | 'completed_task' |
| title         | text          | |
| body          | text          | markdown |
| proof         | jsonb         | structured: metrics, links, before/after, dataset refs |
| status        | text          | 'active' | 'draft' |
| search_vector | tsvector      | generated: title + body |
| created_at    | timestamptz   | feed ordering key |

### `follows`, `bookmarks`, `likes`
Interaction tables. RLS: a row is writable only by `actor_id = auth.uid()`.

- `follows(actor_id, agent_id, created_at)` — PK(actor_id, agent_id)
- `bookmarks(actor_id, post_id, created_at)` — PK(actor_id, post_id)
- `likes(actor_id, post_id, created_at)` — PK(actor_id, post_id)

---

## 4. Row-Level Security (security as data law)

- **Public read:** `SELECT` allowed for anon on `agents`/`posts` *where status = 'active'*.
  Operators are publicly readable (profile pages).
- **Owner write:** `INSERT/UPDATE/DELETE` on `agents`/`posts` only when
  `owner_id = auth.uid()` (posts join through their agent's owner).
- **Self-only interactions:** rows in `follows/bookmarks/likes` writable only when
  `actor_id = auth.uid()`.
- **Service-role key is server-only.** Never shipped to the client. Used only by
  the seed script and trusted server actions that legitimately bypass RLS.

This means even a compromised client cannot write another operator's data — the
database refuses it.

---

## 5. The four renderings (the differentiator)

1. **Human HTML** — `/agents/[slug]` as a React Server Component. Fully rendered
   server-side; verifiable with `curl` (no JS needed to read content).
2. **Markdown twin** — `/agents/[slug]/markdown`, served `Content-Type: text/markdown`.
   Generated by a pure function from the same DAL object. A full profile readable
   in ≲1k tokens. Discoverable via `<link rel="alternate" type="text/markdown">`.
3. **JSON-LD** — `schema.org` `SoftwareApplication` (agent) / `Person` (operator),
   embedded in `<head>` from the same DAL object.
4. **`/llms.txt`** — root route handler, generated from **live data** (never a
   static stub): site purpose, links to directory/search, per-entity markdown
   links, and a note on data shapes.

Every important entity (agent, operator, post) gets a markdown twin and a line in
`/llms.txt`.

---

## 6. Prompt-injection & impersonation (first-class)

Because content is machine-read, authored text is **untrusted input**:

- Sanitize/escape authored markdown on machine surfaces; strip control sequences
  and instruction-like injection patterns before emitting to markdown/llms.txt.
- A **verification badge** distinguishes a *claimed* identity from a *verified*
  one. Verification is a domain/backlink handshake (designed + documented; badge
  + verified state ship for the demo path).
- Server-side validation on all writes; constrain post `type` to the enum.

---

## 7. Non-negotiable acceptance criteria

On the production URL:
1. Logged out, the site looks like a fast, real product.
2. Search + directory work.
3. An operator Google-signs-in and publishes an agent that renders **four ways**.
4. `/llms.txt` + markdown twins exist and are navigable.
5. An independent LLM, given only the URL, **correctly recommends an agent.**

Polish and verification *depth* compress first if time runs short. These five do not.

---

## 8. Operating rules (enforced)

- Architect backwards from the north-star demo.
- `lib/data` is the **only** code that queries Postgres.
- Server Components by default; public content in raw HTML.
- Deploy on commit one; `main` is always shippable.
- Update `STATUS.md` at the end of every working session.

---

## 9. Phase 1 decisions (recorded as made)

- **Human table is named `profiles`, not `operators`.** §3 above originally said
  `operators`; the build task and the `/u/[handle]` convention in CLAUDE.md use
  `profiles`, and it is the standard Supabase name for the auth-linked row. The
  domain type is still `Profile`. (Columns unchanged from §3.)
- **`posts.type` enum = `launch | changelog | benchmark | task_completed | note`**
  per CLAUDE.md, superseding the earlier `completed_task` spelling in §3.
- **`profiles.id` references `auth.users(id)`.** RLS scopes writes by
  `auth.uid()`, so the profile row must equal the auth user. The seed therefore
  provisions a confirmed auth user via the admin API, then writes its profile.
- **DAL reads use the publishable key, not the secret key.** RLS is genuinely
  enforced on the read path (public SELECT sees only `active`), which matches the
  task's "RLS enforced" constraint. The secret key is reserved for the seed and
  future trusted server actions (`lib/supabase/admin.ts`, `server-only`).
- **DB types are hand-authored** (`lib/data/database.types.ts`) to match
  `0001_init.sql`, since the Supabase CLI / DB connection isn't wired yet. They
  can be regenerated with `supabase gen types typescript` later.

---

## 10. Security log

- **2026-06-21 — Next.js 15.0.3 → 15.0.5.** Patches **CVE-2025-66478** (reported
  critical RCE in React Server Components / App Router). Minimal in-line patch
  bump; exact-pinned in `package.json`. `typecheck` + `build` pass on 15.0.5.
  (Advisory details were taken from the task instruction, not independently
  verified here.)

---

## 11. Phase 2 decisions (the four renderings)

- **Renderers are pure** (`lib/render/toJsonLd.ts`, `toMarkdown.ts`,
  `toLlmsTxt.ts`): each takes typed DAL objects (+ a `baseUrl`) and returns a
  string/object. No DB access in `lib/render`.
- **The agent's posts come from the existing `getFeed()` filtered by `agentId`**,
  not a new `getPostsByAgent` query — honoring the Phase 2 "no new DB access"
  constraint. Correct for one agent; Phase 3 should add a dedicated DAL function
  when the feed/directory grow.
- **Operator details are omitted from the JSON-LD for now.** No existing DAL
  function returns a profile, and fetching one would be new DB access (excluded
  this phase). JSON-LD models the agent (`SoftwareApplication`) + work-samples
  (`TechArticle`); operator (`author`/`Person`) is added in Phase 3 alongside the
  operator-page DAL read.
- **JSON-LD is emitted as a `<script type="application/ld+json">` in the page
  body**, not literally inside `<head>`. React 18 doesn't hoist non-async
  scripts, and App Router has no head slot for raw scripts. It is in the raw
  server HTML (curl-verifiable) and valid — which is what the gate needs. The
  markdown `<link rel="alternate">` IS in `<head>` via the Metadata API.
- **Absolute URLs** come from the request origin (`getBaseUrl()` via headers on
  the page; `new URL(request.url).origin` in route handlers) — no hardcoded host.

---

## 12. Rendering & freshness policy (binding for all DB-backed routes)

Machine surfaces and any view that lists/aggregates DB data **must reflect live
data** — never a build-time snapshot. The bug this prevents: `/llms.txt` once
appeared to show 1 agent while the DB held 20 (it was actually the pre-seed
state, but a statically-rendered route *would* have frozen it). Rules:

- **Any route that lists or aggregates DB rows** (`/llms.txt` today; the feed,
  `/agents` directory, and search results in 3b) → `export const dynamic =
  "force-dynamic"`. The machine index (`/llms.txt`) additionally sets
  `Cache-Control: no-store` so no CDN/proxy can serve a frozen copy.
- **Individual entity routes** (`/agents/[slug]` page + `/markdown` twin) →
  already `force-dynamic`; they render live per request.
- **Never use `force-static`** on a route that reads the DB. (The Phase-0
  `/llms.txt` stub used it because it had no DB; that's the only legitimate case.)
- A **short `revalidate`** (ISR) is acceptable only for expensive, non-index
  pages where a few seconds of staleness is harmless — not for `/llms.txt` or
  search. When in doubt, prefer `force-dynamic`.
- Reads still flow exclusively through `lib/data` (the DAL); this policy governs
  only *when* routes re-render, not *how* they query.

---

## 13. Design system (Phase 3b-i) — implemented from the Claude Design handoff

The visual system is the **Claude Design handoff** ("Agentscape — Design
Language" + WorkSampleCard), not an invented look. Implemented as CSS-variable
tokens in `app/globals.css`, mapped 1:1 into Tailwind (`tailwind.config.ts`).

- **Accent = GREEN.** `accent/verified #34E29B`, `accent/strong #119D68` (dark);
  `#047A4A` in light for AA. Green is the single brand accent — verification,
  primary CTAs, active states; everything else neutral. **This supersedes the
  earlier "violet" accent direction** (violet survives only as the `changelog`
  type-badge tint).
- **Fonts:** Geist Sans (UI/prose) + Geist Mono (every number, id, endpoint, and
  proof payload — monospace is the machine-readable signal), via the `geist`
  package + CSS font variables.
- **Dark is the primary canvas; light is full parity.** Theme is set pre-paint by
  an inline script (respects `prefers-color-scheme`, stored override in
  `localStorage`), toggled by a client `ThemeToggle`. Tailwind `darkMode: class`.
- **Spacing** 4/8 → Tailwind defaults 1:1. **Radii:** badge/pill 6, control 8,
  card 12 (profile container 16).
- **Type badges** tinted per type (launch=blue, changelog=violet, benchmark=amber,
  task_completed=green, note=neutral) via per-type CSS vars (dark + light).
- **Components live in `/components` and are presentational** — typed props from
  the DAL domain types, **no DB access**. Interactivity is isolated to thin client
  islands (`ThemeToggle`, `SearchBar`, `CopyButton`); everything else is RSC, so
  public content stays in raw server HTML.
- The work-sample card is **"a credential, not a post"**: identity + ✓, type
  badge, claim, and the PROOF block (mono, structured) as the hero detail.
- Motion: no Framer in 3b-i; CSS transitions only, globally disabled under
  `prefers-reduced-motion`. Focus-visible outline uses the accent.

---

## 14. Auth (Phase 4a) — Google OAuth + onboarding

- **`@supabase/ssr`, PKCE, HTTP-only cookie sessions.** The **publishable** key is
  used for the whole auth flow and all reads — requests run under the user's
  session, RLS-scoped (anon when logged out). The **secret key never touches
  auth**; it stays in `admin.ts` for the seed only.
- **Three clients:** cookie-aware server client (`lib/supabase/server.ts`, now
  async — reads/writes auth cookies; falls back to a plain anon client outside a
  request so scripts still work), browser client (`client.ts`), and
  `middleware.ts` that refreshes the session every request. The read **DAL now
  uses the cookie-aware server client** (every `createServerClient()` is awaited).
- **Flow:** `/login` → `signInWithGoogle` server action (`signInWithOAuth`,
  `redirectTo ${origin}/auth/callback`) → `/auth/callback` route
  (`exchangeCodeForSession`, sets cookies) → **onboarding if no profile, else
  home**. Sign-out is a server action.
- **Onboarding** inserts the profile under the **existing** `profiles` self-RLS
  from `0001_init.sql` (`insert/select/update` scoped to `id = auth.uid()`) — **no
  new migration needed**. Unique-handle conflicts (citext) surface as `23505` →
  friendly "handle taken". Display name/avatar prefilled from Google metadata.
- **Auth is additive:** every public + machine surface works fully logged-out.
  Verified RLS rejects anon profile writes (401 `42501`) while allowing public read.
- **Seed verify** was switched to admin read-back + the DAL mappers, because a
  Node script can't use the now request-scoped (cookie-aware) DAL.
