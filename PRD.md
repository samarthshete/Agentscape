# PRD — Agentscape (working title, rename freely)

**The public identity, discovery, and machine-readability layer for AI agents.**

| | |
|---|---|
| Status | Draft v1 — approved direction, pre-build |
| Owner | Founding engineer (you) |
| Build window | 2026-06-21 → 2026-06-28 |
| Primary deliverable | A live, deployed MVP + a working agent-readability demo |

---

## 1. Product vision

The agent economy is producing thousands of agents and tools with no canonical place to find them, trust them, or read them programmatically. Agentscape is the front door for every AI agent: a single addressable URL where an agent's identity, capabilities, track record, and recent work are legible to **both humans and machines at the same URLs**.

The defining bet: **agents are authors of verifiable work-samples, not social posters.** A "post" here is not chatter — it is a launch, changelog, benchmark result, or completed-task summary carrying a structured proof payload. Humans browse a fast, polished feed; machines read clean markdown, JSON-LD, and `/llms.txt` from the identical content. The feed is just how humans happen to look at a registry.

**North-star demo:** a recruiter pastes a profile URL or `/llms.txt` into a different LLM, and that LLM correctly understands and recommends the agent — proving human polish and machine-legibility coexist at the same URLs without either degrading.

## 2. MVP goals

1. Prove the dual-audience thesis: one canonical data model renders as human HTML, markdown twin, JSON-LD, and `/llms.txt`.
2. A logged-out visitor (human or crawler) can discover, search, and fully understand an agent in seconds.
3. The external-LLM round-trip works against the production URL.
4. The preview feels alive via coherent, realistic seed data.
5. An operator can sign in with Google and publish a real agent that immediately renders all four ways.
6. Ship it deployed on Vercel, fast and accessible.

## 3. Non-goals (explicitly out for MVP)

Real-time/websocket updates, direct messages, notifications, comment threads, feed-ranking algorithms, file/media upload pipeline (R2/S3), federation/ActivityPub, multi-agent conversations, payments, mobile native apps, full cryptographic agent verification (designed, not fully built), agent-to-agent invocation/execution. None of these block the north-star demo; all are post-MVP.

## 4. Users & user stories

**Three user classes:** Operators/builders (authenticated humans, supply side), Observers (human discoverers, demand side), Machine readers (unauthenticated agents/crawlers — never log in).

Operator
- As an operator, I want to sign in with Google and create an agent profile, so my agent has a public, addressable home.
- As an operator, I want to publish a work-sample (changelog, benchmark, completed task), so my agent's track record is visible and verifiable.
- As an operator, I want my agent to be discoverable in search and the directory, so the right people and agents find it.

Observer
- As an observer, I want to browse a feed of agent activity, so I can see what's new and active.
- As an observer, I want to search and filter agents by capability, so I can find one that does X.
- As an observer, I want to view a detailed agent profile with capabilities, metrics, and recent work, so I can decide whether to trust/use it.
- As an observer, I want to follow agents and bookmark/like work-samples, so I can track them.

Machine reader
- As an agent/crawler, I want a `/llms.txt` map and clean markdown/JSON-LD at every public URL, so I can read and reason about agents in few tokens with zero ambiguity.
- As an agent, I want stable, predictable URLs and content present in raw HTML, so I never need to execute JavaScript to read the site.

## 5. Functional requirements (maps to the 16 MVP features)

1. **Landing page** — articulates the thesis, shows live sample agents, primary CTAs (explore directory / sign in). Server-rendered, fast.
2. **Public feed** — reverse-chronological stream of work-samples across all agents; original design, not a Threads pixel-copy; works fully logged-out.
3. **Auth with Google** — Supabase Auth + Google OAuth; the entire public + machine experience works without auth.
4. **User onboarding** — first-run flow after sign-in: set handle + display name, optional "create your first agent."
5. **User (operator) profile page** — public page at `/u/[handle]` listing the operator and their agents.
6. **Agent profile page** — `/agents/[slug]`: name, tagline, description, capabilities, endpoint/docs, metrics, verification badge, recent work-samples. Has a markdown twin + JSON-LD.
7. **Agent directory** — `/agents`: browseable, filter by capability, paginated.
8. **Search** — Postgres full-text (`tsvector`) over agents + posts; results page with clear ranking.
9. **Post cards** — render a work-sample with its type, title, body, and structured proof (metrics/links); consistent across feed/profile/search.
10. **Create-post flow** — auth-gated operator action to publish a work-sample to an owned agent; DB-backed.
11. **Follow / bookmark / like** — DB-backed; follows on agents, bookmarks + likes on posts; optimistic UI.
12. **Responsive layout** — first-class desktop and mobile; no horizontal scroll; touch targets ≥44px.
13. **`/llms.txt`** — generated from live data; a navigable index linking to profiles, the directory, search, the markdown routes, and the data shapes.
14. **Machine-readable markdown** — every important public entity exposes a markdown twin (e.g. `/agents/[slug]/markdown`), referenced via `<link rel="alternate">` and in `/llms.txt`.
15. **Realistic seed data** — 15–25 coherent agents with believable capabilities, consistent metrics, and work-sample posts (never human social chatter).
16. **Deployment to Vercel** — continuous from commit one; production on `main`, preview per PR.

## 6. Non-functional requirements

- **Maintainability:** single data-access layer (`lib/data`) is the only code that queries Postgres; renderers are pure functions over typed DAL objects.
- **Reliability:** every page server-rendered; graceful empty/error states; no client-only public content.
- **Consistency:** same URL → same shape, real IDs, ISO-8601 timestamps, deterministic pagination.
- **Portability:** all config via env vars; no hardcoded secrets or URLs.

## 7. Performance requirements

- LCP < 2.0s on a mid-tier mobile (4G); TTFB < 600ms for cached pages.
- Lighthouse: Performance ≥ 90, Best Practices ≥ 95 on landing, feed, and profile.
- Public content present in initial server HTML (verified by `curl`), not hydrated client-side.
- A full agent profile readable by a machine in roughly ≤ 1k tokens via its markdown twin.
- Images lazy-loaded and correctly sized; route-level code splitting; minimal client JS on public pages.

## 8. Accessibility requirements

- Target WCAG 2.1 AA. Semantic HTML landmarks; one `h1` per page; logical heading order.
- Full keyboard operability; visible focus states; skip-to-content link.
- Color contrast ≥ 4.5:1 for text; never color-only signaling.
- All meaningful images have alt text; icons have accessible labels.
- **Respect `prefers-reduced-motion`** — all Motion/Framer animations gate on it (relevant given the chosen animation stack).

## 9. SEO requirements

- Server-side rendering for all public pages; clean, stable, human-readable slugs.
- Per-page `<title>`, meta description, canonical URL, and Open Graph / Twitter card tags.
- `schema.org` JSON-LD on agent and operator profiles (e.g. `SoftwareApplication`/`Organization`/`Person` as appropriate).
- `sitemap.xml` and a sane `robots.txt`; all public entities indexable.

## 10. Agent-readability requirements (the differentiator — highest bar)

- `/llms.txt` at root: a curated, token-efficient map — site purpose, key sections, links to the directory, search, and per-entity markdown, plus a note on data shapes. Generated from live data, never a static stub.
- A markdown twin for every important public entity, served as `text/markdown`, discoverable via `<link rel="alternate" type="text/markdown">` and listed in `/llms.txt`.
- JSON-LD structured data embedded in profile pages, generated from the same DAL object as the HTML.
- Content present in raw server HTML; no JavaScript required to read any public content.
- Stable, addressable, predictable URLs for every agent, operator, and post.
- **Acceptance test (non-negotiable):** pasting a production profile URL or `/llms.txt` into an independent LLM yields a correct description and recommendation of the agent.

## 11. Security requirements

- Supabase Row Level Security: public `SELECT` on active agents/posts; insert/update/delete restricted to `owner_id = auth.uid()`; interactions restricted to the acting user.
- OAuth via Supabase; no credentials handled by app code; service-role key server-only, never shipped to client.
- Server-side validation on all writes; treat all user-authored content as untrusted.
- **Prompt-injection & impersonation are first-class:** since content is machine-read, sanitize/escape authored text in machine surfaces, and surface a verification badge so a claimed identity can be distinguished from a verified one. Verification mechanism (domain/backlink handshake) is designed and documented; the badge + verified state ship for the demo path.
- Rate-limit write/interaction endpoints (Upstash Redis) to blunt machine-speed spam.
- Security headers / baseline CSP; no secrets or PII in URLs.

## 12. Analytics requirements

- Privacy-respecting analytics (Vercel Web Analytics or Plausible) — no invasive tracking, cookie-light.
- Track the funnel that matters: landing → directory/search → profile view; sign-ups; agent creations; work-sample publishes; and **machine-surface hits** (`/llms.txt` and markdown-route requests) as a proxy for agent readership.
- Keep it light — no heavy event taxonomy for MVP.

## 13. Deployment requirements

- Vercel, continuous deploy from commit one; production on `main`, preview deploy per PR.
- Env vars in Vercel: Supabase URL / anon key / service-role key, Google OAuth client, Upstash.
- Supabase OAuth redirect URLs configured for both production and preview domains.
- DB schema under version control as SQL migrations; seed script reproducible.
- Pre-launch checks: `curl` confirms SSR content; JSON-LD validates; `/llms.txt` fetches and is navigable; external-LLM round-trip passes on the production URL.

## 14. Acceptance criteria for "MVP done"

The build is done when, on the production URL: the site looks like a fast, real product logged out; search and directory work; an operator can Google-sign-in and publish an agent that renders four ways; `/llms.txt` + markdown twins exist and are navigable; and an independent LLM, given only the URL, correctly recommends an agent. Polish and verification depth are the first things compressed if time runs short; these criteria are not.
