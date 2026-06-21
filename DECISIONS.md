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
