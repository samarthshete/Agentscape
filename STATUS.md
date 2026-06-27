# STATUS

> Updated at the end of every working session (operating rule).

## Current phase
**Phase 6 — Lighthouse / a11y polish — COMPLETE (2026-06-24). PROJECT COMPLETE.**
All phases done. Security patch (Next 15.5.19), 5b rate-limiting, Phase 6 writeup
done. 5a + 4b human gates PASSED. Phase 2 de-risk gate PASSED.

## Submission bug-fix pass (2026-06-27) — reviewer findings
Presentational/behavioral only. NO change to the DAL, RLS, the four renderers, or
any machine-surface *structure*; the one data edit (P3) was an agent's endpoint value.

- **P1 — Mobile navigation.** Below `md` the inline links + search had no
  replacement. Added `components/MobileNav.tsx` (thin client island): a labelled
  hamburger (`md:hidden`) opening a menu with the search input + all nav links
  (Feed/Directory/Operators/Docs) + account/Sign in/Sign out. Accessible:
  `aria-label`/`aria-expanded`/`aria-controls`, Escape + outside-click + route-change
  + resize-to-desktop close, focus moved into the panel on open and back to the
  button on close. Portaled to `<body>` (the nav's `backdrop-blur` would otherwise
  contain the `fixed` panel). Motion covered by the global reduced-motion guard.
  TopNav: inline links `sm:flex`→`md:flex` and the account/sign-in cluster wrapped
  `hidden md:flex` so they pair with the hamburger; Submit + ThemeToggle stay in the
  bar. **Desktop nav unchanged.** Rest of the page stays RSC.
- **P2 — Sign-out didn't transition.** Root cause (from code): `signOut()` cleared
  the session but never revalidated, so the server-rendered nav was served from the
  router/RSC cache and kept showing signed-in. Fix: `revalidatePath("/", "layout")`
  before `redirect("/")` in `app/auth/actions.ts`. (Could not click-through prod
  sign-in here — no Google session in this env; the dashboard layout already bounces
  to /login when signed-out. Final real-session click-through is yours, like the
  4a/4c/5a human gates.)
- **P3 — Real endpoints.** Seed was already clean. The live, user-created **Atlas
  Briefing Agent** row still pointed at `example.com`; re-pointed via the service-role
  admin client to `https://api.atlasbrief.dev/v1/brief` (+ docs `docs.atlasbrief.dev`).
  Verified live: zero `example.com` across all 21 markdown twins; 21 agents intact.
  Also updated the create-form URL *placeholders* off `api.example.com`.
- **P4 — Accessibility (surgical).** Icon-only buttons already had `aria-label`
  (ThemeToggle, CopyButton, InteractionBar like/bookmark) — confirmed. Bumped light
  `--faint` `#71717a`→`#6b6b73` so the proof block's muted monospace clears AA with
  headroom (~4.9:1 on `bg-subtle`, up from a razor-thin 4.51). Dark `--faint` already
  ~5.3. Global `:focus-visible` ring + reduced-motion guard already in place.
- **P5 — Create-agent form lost input on slug conflict.** The action redirected with
  `?error=`, and that navigation wiped the form. Added `createAgentFormAction` (returns
  the error instead of redirecting) + `components/NewAgentForm.tsx` (client wrapper):
  submits in an event handler and shows the error **in place** without navigating, so
  the uncontrolled inputs keep their typed values. Success still redirects to the new
  profile; the write still runs under the user's session/RLS. (React 18.3 — used a
  plain handler, not `useActionState`.)
- **Verify:** `typecheck` + `build` clean; all routes still `ƒ`; public pages ship 0
  client components beyond the existing islands + the new MobileNav/NewAgentForm; shared
  JS still 102 kB. `/llms.txt` 21 agents, four-way render unchanged. Mobile-menu /
  sign-out / form click-throughs to confirm in a real browser on prod after deploy.

## Demo add-on — agent-to-agent hiring (`demo/`)
A standalone showcase built on top of the shipped substrate (no app/RLS/renderer
change). A procurement agent (**Claude Opus 4.8**, real tool-use loop via
`@anthropic-ai/sdk`, dev-dep only) is given a task + the public `/llms.txt` and
nothing else; it discovers candidates, vets each via its markdown twin
(capabilities + work-sample proof + verification standing) through a
`fetch_agent_profile` tool, then calls `award_contract` to hire exactly one agent
with cited verifiable evidence. Demonstrates the agent-economy loop ("agents do
business with each other") running on a verifiable trust/identity layer.
- **Files:** `demo/lib/agentscape.ts` (fetch+parse the machine surfaces only — no
  DB), `demo/lib/hire.ts` (the loop), `demo/hire.ts` (narrated single run),
  `demo/eval.ts` (capability-routing eval — gold = the hired agent's twin actually
  carries a task-relevant capability; keyword-matched, slug-agnostic), `demo/README.md`.
- **Scripts:** `npm run demo:hire` / `npm run demo:eval` (need `ANTHROPIC_API_KEY`;
  target prod by default, override `AGENTSCAPE_BASE_URL`).
- **Verified:** live fetch+parse of prod `/llms.txt` → 21 agents, twin fetch + gold
  predicate match (no key needed); `typecheck` + `build` clean (demo `.ts` is in the
  build's typecheck scope — the Phase-5a trap — and passes; 0 demo code in the app
  bundle, shared JS still 102 kB). The Claude call itself is unrun here (no API key in
  env) but follows the documented manual tool-use loop.

## Phase 6 — Lighthouse / a11y polish (2026-06-24)
Measure-then-fix; presentational only — no change to the design language, the four
renderers, RLS, or any machine-surface content. Measured with Lighthouse (headless
Chrome) on production, mobile + desktop.

**Lighthouse, production (Perf / A11y / BestPractices / SEO):**

| Page | BEFORE (mobile) | AFTER (mobile) | AFTER (desktop) |
|---|---|---|---|
| landing   | 100 / 100 / 96 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| feed      | 98 / **93** / 96 / 100 | 98 / **100** / 100 / 100 | 100 / 100 / 100 / 100 |
| directory | 97 / 100 / 93 / 100 | 99 / 100 / 96 / 100 | 100 / 100 / 100 / 100 |
| profile   | 98 / **95** / 96 / **92** | 99 / **100** / 100 / **100** | 100 / 100 / 100 / 100 |
| search    | 99 / **95** / 96 / 100 | 99 / **100** / 100 / 100 | 100 / 100 / 100 / 100 |

All targets met: Perf ≥98, A11y = 100, Best Practices ≥96, SEO = 100.

**Fixes (presentational):**
- **Contrast (AA, both themes — verified by WCAG math):** dark `--faint`
  `#6b6e76 → #868990` (3.67 → 5.35 on card; dark is the primary canvas, which
  Lighthouse's light-only run had missed); light `--badge-benchmark-fg`
  `#b45309 → #a64c08` (4.49 → 5.14 — the one node axe flagged); proof-block note
  `text-faint/80 → text-faint`.
- **Heading order:** feed gained an `sr-only <h2>` so card `<h3>`s don't skip a
  level (h1→h2→h3); profile/search already had a section `<h2>`.
- **SEO:** root `metadataBase` + default OG/Twitter; profile `openGraph`/`twitter`
  — canonical is now absolute (fixed the profile SEO 92).
- **Best Practices:** `app/icon.svg` (brand mark) → no more `/favicon.ico` 404
  console error (BP 96 → 100).

**Deliberately not changed:** disabled pagination `text-faint/50` (inactive
controls are WCAG-exempt and Lighthouse didn't flag them); no lazy-load/CLS work
(there are no `<img>` — avatars are letter tiles, icons inline SVG); fonts already
self-hosted via `next/font` (no FOUT/blocking); client JS already minimal (thin
islands only).

**Verification:** A11y = 100 on all pages (keyboard focus + names pass — controls
are native `button`/`a`/`input` with the global `:focus-visible` 2px accent ring;
reduced-motion already honored); AA contrast confirmed light AND dark by
computation; SSR content still in raw HTML (`curl`); four-way render + `/llms.txt`
unchanged (21 links, `no-store`, JSON-LD `verificationStatus` intact, no meta leak
in the markdown twin); `typecheck` + `build` clean; deployed + confirmed live.

## Resume metrics — production measurements (2026-06-24)
MEASURE-ONLY pass on the live deploy (`https://agentscape-kappa.vercel.app`). No
product/renderer/RLS/machine-surface change. All numbers reproducible via the
methods stated.

**Fresh Lighthouse (headless Chrome via Chrome 12.x CLI, today). Perf / A11y / BP / SEO + LCP / CLS:**

| Page | Mobile | LCP / CLS (m) | Desktop | LCP / CLS (d) |
|---|---|---|---|---|
| landing   | 99 / 100 / 100 / 100 | 2.2 s / 0     | 100 / 100 / 100 / 100 | 0.5 s / 0 |
| feed      | 100 / 100 / 100 / 100 | 1.7 s / 0    | 100 / 100 / 100 / 100 | 0.5 s / 0 |
| directory | 99 / 100 / **96** / 100 | 2.1 s / 0   | 100 / 100 / 100 / 100 | 0.5 s / 0 |
| search    | 99 / 100 / 100 / 100 | 2.2 s / 0     | **90** / 100 / 100 / 100 | 0.5 s / 0 |
| profile   | 99 / 100 / 100 / 100 | 2.2 s / 0     | 100 / 100 / 100 / 100 | 0.5 s / 0 |

*How: `npx lighthouse@12 <url> --only-categories=… --preset=desktop|mobile
--chrome-flags="--headless=new"`, JSON output, scores ×100. CLS = 0 on every page
(letter-tile avatars + inline SVG, no `<img>`). No regression vs prior STATUS;
directory-mobile BP 96 matches the earlier run; search-desktop Perf 90 is
single-run variance (still ≥90 target).*

**Token efficiency (the on-thesis metric) — agent `atlas-research`:**

| Surface | Tokens (cl100k_base) | Bytes |
|---|---|---|
| Full rendered HTML page | 17,975 | 60,341 |
| Markdown twin (`/markdown`) | 439 | 1,734 |
| **Ratio (twin / HTML)** | **2.4 %** (≈41× smaller) | — |

*How: `curl` both surfaces from prod; tokenized with the real tiktoken BPE
`cl100k_base` via `@dqbd/tiktoken`. The agent is fully machine-legible in ~440
tokens — 2.4 % of the HTML an LLM would otherwise ingest.*

**Full-text search latency (`searchAgents`, live catalog):**

| n | min | p50 | p95 | p99 | mean |
|---|---|---|---|---|---|
| 150 | 95 ms | 115 ms | 192 ms | 445 ms | 133 ms |

*How: replays the exact DAL PostgREST query (Postgres `tsvector` `websearch` on
`search_vector`, GIN-indexed, `order created_at desc`, `range 0–19`) over 6 terms
× 25 iters, 12 warm-up discarded, one reused warm client. Client-side round-trip
incl. network to the hosted Supabase region; min ~95 ms is the network floor, so
the tsvector query itself adds little. Not a load test.*

**Payload facts (from `next build`):**
- First Load JS **shared by all routes: 102 kB** (two chunks: 54.2 + 46.2 kB).
- Representative public routes (First Load JS): landing 106 kB, feed 104 kB,
  directory 106 kB, search 108 kB, profile (`/agents/[slug]`) 108 kB.
- **Public pages ship 0 client components** — every file under `app/(public)`
  is an RSC (`grep "use client"` → 0). The only client JS is 5 thin shared
  islands (ThemeToggle, SearchBar, CopyButton, InteractionBar, FollowButton).
- *Source: `npm run build` route table + `grep -rl "use client"`.*

## Phase 6 — re-verification (2026-06-24)
Re-ran the exit gate against the committed/deployed state (no code changes; phase
was already complete in commits `7cae8c1` + `87df825`). Reverted one stray
whitespace-only edit to `0003_add_agent_pricing_model.sql` (already-applied
migration) — working tree clean. `typecheck` + `build` clean (all routes `ƒ`).
Production live: profile SSR content in raw HTML, JSON-LD present, markdown twin
`text/markdown`, `/llms.txt` 21 links `no-store`; `/`, `/feed`, `/agents`,
`/search`, profile all 200. No redeploy needed (nothing changed since last deploy).

## Security patch — Next.js 15.0.5 → 15.5.19 (2026-06-24)
Upgraded off 15.0.5 to the latest patched 15.x; `eslint-config-next` matched;
React stays 18.3.1; App Router unchanged; **no code changes needed**.
- **Resolves all Next.js advisories**, incl. **CVE-2025-29927** (CVSS 9.1
  middleware auth-bypass — directly relevant since auth gating uses `@supabase/ssr`
  middleware), and the Server-Actions/RSC DoS, cache-poisoning, image-optimization,
  and middleware-redirect SSRF advisories. `npm audit` now shows **zero Next.js
  findings**.
- **Stayed on 15.x** (not Next 16, which would force React 19). Reviewed
  15.1→15.5 notes — only deprecation warnings for unused features (`next lint`,
  `legacyBehavior`, AMP, `next/image` quality); `next build` still lints.
- **Regression PASSED:** `typecheck` + `build` clean; routes all `ƒ` (dynamic);
  four-way render intact (HTML 200, markdown twin 200 `text/markdown`, JSON-LD
  present, `/llms.txt` 200 `no-store`); middleware auth-gating works
  (dashboard/onboarding → 307 `/login`); RLS unchanged (no DAL/policy edit).
- **Remaining (non-Next, out of scope, low reachability):** `@supabase/auth-js`
  path-routing (separate supabase-js major bump), `esbuild`/`tsx` (dev-only),
  `postcss` (build-time; authored CSS). See DECISIONS §10.

## Phase 5b — Done (rate limiting)
Upstash Redis via `@upstash/ratelimit` (sliding window), centralized in
`lib/ratelimit.ts` (`server-only`) — one module builds the client + all limiters;
server actions call `rateLimit(bucket, key)`. **Fail-open**: absent env vars or a
Redis error → allow + one-time warning, so local dev and the demo never break;
limiting engages only where configured (Vercel).
- **Limited (writes + auth), keyed by user id / IP:** `mutation` 20/min (create/
  update agent, create post), `interaction` 60/min (follow/like/bookmark),
  `verify` 5/10min (domain-verify — strictest; outbound fetch + service-role
  write), `auth` 10/10min per IP (OAuth start).
- **Friendly on limit:** form actions redirect with `?error=…`; interaction
  islands get a `rate_limited` WriteResult and roll back (visible, not silent);
  auth → `/login?error=too_many_attempts`. Guard in front of actions only — DAL,
  RLS, renderers, and machine surfaces unchanged.
- **No read-surface limit** (deliberate): a per-IP cap on `/llms.txt`/markdown
  could trip a normal external-LLM fetch (shared egress IPs). The demo wins. See
  DECISIONS §19.
- Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (added to `.env.example`
  + commented in `.env.local`; **set both in Vercel to activate in prod**).

## Phase 5b — Verification
- **Fail-open PASSED** (`db/verify/verify_ratelimit.ts`, no creds): 7/7 allowed
  despite the 5/10min verify bucket, warning logged once.
- **Machine surfaces unaffected:** single fetch of `/llms.txt` (text/plain),
  `/agents/atlas-research/markdown` (text/markdown), profile, feed all 200; 21
  markdown links unchanged. No limiter touches `lib/render`, `/llms.txt`, or the
  markdown route.
- `typecheck` + `build` clean.
- **PENDING (human, prod):** set Upstash creds in Vercel, then `verify` ×6 quickly
  → 6th shows "doing that a bit too fast"; or run
  `NODE_OPTIONS=--conditions=react-server npx tsx db/verify/verify_ratelimit.ts`
  with creds (expect 5 allowed / 2 blocked). (Pre-existing Next.js 15.0.5 audit
  advisories are unrelated to this phase — a separate upgrade.)

## Phase 6 — Done (reviewer-facing docs)
- **README.md** rewritten (was a stale Phase-0 stub): positioning + the explicit
  "not Threads for agents" reframe; a **Try-the-demo** block near the top (paste
  `/llms.txt` into a fresh LLM); three user classes; a **mermaid**
  one-model→four-renderings diagram; the 16 features grouped (human / machine /
  operator+auth+trust); stack; quickstart with the real env var names, migration
  order, and `npm run db:seed`; scope/non-goals framed as judgment; links to the
  other docs. Grounded in real paths, the real prod URL, and `atlas-research`.
- **ARCHITECTURE.md** (new): the dual-audience problem; one-model→four-renderers
  with two mermaid diagrams (render flow + auth flow); the disciplines (`lib/data`
  the only DB access, `lib/render` pure, RSC-default); the freshness policy + why;
  the data model table; the **security model** highlight (adversarial RLS `42501`,
  the verification column-privilege lock, the SSRF guard); key decisions linking
  DECISIONS.md.
- **DEMO.md** (new): 5-minute numbered runbook (landing → feed/directory → profile
  → four-way render → external-LLM read → Google sign-in → publish → verify →
  badge flips), a 60-second version, gotchas (fresh LLM; the app's own
  `/.well-known` holds one agent's token; real-looking endpoints; seed first), and
  4 talking points (reframe / one-model-four-renderings / security / de-risk-first).
- **.env.example** added (the three real env vars, documented).
- Docs LINK to PRD/PLAN/DECISIONS/STATUS/CLAUDE rather than duplicating them.

## Phase 6 — Housekeeping (Task 0)
- **PRD.md committed** (was untracked) — part of the project charter.
- **Typecheck scope confirmed aligned with the build.** `tsconfig` includes
  `**/*.ts`, so `npm run typecheck` covers the whole project incl. `db/` scripts —
  identical to what `next build` type-checks. Re-proved the exact 5a failure is
  caught locally (`db/verify/verify_0004.ts … error TS2532`). Recorded in
  DECISIONS.md §18 alongside the CI + pre-push guards added 2026-06-24.

## Phase 6 — Verification
- `npm run check` (typecheck + build) clean; all doc cross-links resolve; 3
  mermaid blocks (1 README + 2 ARCHITECTURE) with bracket-safe labels.
- Production demo URLs all 200 (`/`, `/agents`, `/feed`, `/llms.txt`,
  `/agents/atlas-research` + `/markdown`, `/agents/atlas-briefing-agent`).

## Phase 5a — human gate PASSED (2026-06-24)
Migration 0004 applied. `@samarth` ran the real /.well-known handshake on
production for **Atlas Briefing Agent**: hosted the per-agent token at
`https://agentscape-kappa.vercel.app/.well-known/agentscape-challenge.txt` (served
from the app's own `public/` folder), clicked Verify → flipped to
`domain_verified` (`verified_domain = agentscape-kappa.vercel.app`). Confirmed
live four ways: profile badge, markdown twin (`Status: … domain-verified …`),
and JSON-LD (`verificationStatus`/`verifiedDomain`). Column-privilege gate
(`db/verify/verify_0004.ts`) PASSED — owner cannot set any trust column via
UPDATE/INSERT (42501); only the admin path flips it.

### Deploy incident + fix (2026-06-24)
The Phase 5a commit shipped a verifier script (`db/verify/verify_0004.ts`) with a
strict-mode array-index type error. `next build` type-checks every `.ts` file, so
the **Vercel build failed and production silently stayed on the Phase 4c deploy**
(no verify route/button/token/badge). Fixed the guard, re-ran the full build, and
redeployed — 5a is now live. Lesson: run `npm run build` (not just incremental)
before pushing when adding any `.ts` under `db/`.

## Phase 5a — Done (HTTPS /.well-known domain verification)
Real handshake: an operator hosts a per-agent token at
`https://<domain>/.well-known/agentscape-challenge.txt`; a server action fetches
+ validates it (SSRF-guarded) and flips the badge. Verification is trust/identity
so it IS machine-visible — the intentional opposite of the human-only 4c
interactions.
- **Migration 0004** (additive, idempotent — `db/migrations/0004_…sql`): adds
  `verification_token` (random per agent, backfilled, NOT NULL + default),
  `verification_status` ('unverified' | 'domain_verified', checked), and
  `verified_domain`. **Security core — column-privilege lock:** revoke table
  INSERT/UPDATE on `agents` from anon/authenticated, then re-grant only the
  business columns. The five trust columns (verified, verified_via,
  verification_status, verified_domain, verification_token) are writable ONLY by
  service_role, so the badge is unforgeable even by the agent's own owner — RLS
  alone would have let an owner set `verified=true`.
- **DAL** (`markAgentDomainVerified`, the sole writer of the trust columns, via
  the admin/service-role client) — called only after the action confirms
  ownership + a token match.
- **SSRF-guarded fetch** (`lib/verification/challenge.ts`, server-only): https
  only; we build the URL from a validated bare hostname (no scheme/path/port/
  userinfo injection); resolve the host and **reject any private / loopback /
  link-local / reserved IP before any fetch**; `redirect: "manual"` (no
  redirects); ~3s timeout; small max body; fixed `/.well-known` path.
- **Verify flow** `verifyAgentDomainAction` + page
  `/dashboard/agents/[id]/verify`: owner-gated; shows the token, the exact
  challenge URL/path, and a domain field (prefilled from the endpoint host);
  clear failure reasons (invalid domain / blocked address / unreachable / not
  found / mismatch). Linked from the dashboard list and the edit page.
- **Create/edit form unchanged** — it never exposed verification fields and the
  DAL create/update never write them; the ONLY path to verified is the challenge.
- **Machine surfaces** now reflect verification: `toMarkdown` (Status line +
  `Verified domain:` line) and `toJsonLd` (`verified`, `verificationStatus`,
  `verifiedDomain` PropertyValues). The token is never emitted. `/llms.txt`
  structure unchanged. Profile header shows the badge + a `verified domain` chip.
  A single helper `lib/verification/status.ts` (`isVerified`/`verifiedViaLabel`)
  is the source of truth across renderers + components.
- **Seed** sets each agent's verification *fixture* (verified fixtures →
  `domain_verified` for their endpoint host); the real handshake runs only for
  live operators — seed agents are never re-verified (DECISIONS §17).

## Phase 5a — Verification
- **SSRF gate PASSED (local unit run):** `isPublicIp` rejects loopback/private/
  link-local/CGNAT/reserved (v4 + v6, incl. `::ffff:` mapped) and allows real
  public IPs; `isValidPublicHostname`/`normalizeDomain` reject IP literals,
  no-dot hosts, underscores, and strip scheme/userinfo/port/path;
  `assertHostResolvesPublic('localhost')` and `fetchChallengeToken('localhost')`
  both throw `blocked_address` **before any HTTP call**.
- **Pre-migration tolerance:** mapper defaults the new fields, so logged-out
  public + machine pages all 200; markdown/JSON-LD render verification from the
  legacy `verified` fixture; no token leak; `/llms.txt` unchanged; the verify
  page is auth-gated (307 → /login).
- `typecheck` + `build` clean (`/dashboard/agents/[id]/verify` builds).
- **PENDING (human, then re-run the committed gate):**
  1. Apply `db/migrations/0004_add_domain_verification.sql` in the Supabase SQL
     editor; re-run `npm run db:seed` so fixtures get their statuses.
  2. `npx tsx db/verify/verify_0004.ts` — proves the **column-privilege security
     gate**: an authenticated owner can create/edit agents but CANNOT set
     verification_status / verified_domain / verified via UPDATE or INSERT
     (42501); only the admin path flips the badge.
  3. **Production happy path:** host the challenge file on a real domain, click
     Verify → agent flips to `domain_verified`; profile badge, markdown twin,
     and JSON-LD all reflect it; wrong/absent token → clear failure, status
     unchanged.

## Phase 4c — Done (follow / like / bookmark)
Understated, human-only affordances over the existing registry — small counts,
no engagement bait. Machine surfaces (markdown twin / JSON-LD / `/llms.txt`)
deliberately UNCHANGED — interactions never appear there.
- **RLS:** the self-scoped policies from `0001` (`follows_write_self`,
  `bookmarks_write_self`, `likes_write_self`, each `actor_id = auth.uid()`) were
  confirmed sufficient. **No new migration / policy.** Likes + follows are
  public-read (countable); bookmarks are self-read (private, uncounted).
- **DAL** (`lib/data`, still the only DB access): `toggleLike(postId)`,
  `toggleBookmark(postId)`, `toggleFollow(agentId)` — idempotent (insert-if-
  absent / delete-if-present, `23505` treated as success), each sets
  `actor_id = auth.uid()` and reads back the authoritative count; return a
  `WriteResult` (`unauthenticated` when signed out). Reads: `getCurrentUserId`,
  `getPostInteractions(ids)` (batched like-count + the user's liked/bookmarked),
  `getAgentInteraction(agentId)` (follower count + following), and
  `listBookmarkedPosts()` for the Saved view.
- **Client islands** (optimistic, roll back on error; signed-out click →
  `/login`): `InteractionBar` (like + bookmark, on `WorkSampleCard` in feed /
  profile / search) and `FollowButton` (on the profile `ProfileHeader`). Both are
  thin `"use client"` islands fed initial state by the RSC; cards stay
  presentational via optional `interaction` / `follow` props. Server-action
  boundary: `app/actions/interactions.ts`.
- **Saved view** `/bookmarks` (under the auth-gated `(dashboard)` group, reuses
  `WorkSampleCard`) lists the user's bookmarks newest-first. Discoverable via a
  "Saved" link in `TopNav` (when signed in) and on `/dashboard`.
- **Follow kept to the profile only** (not `AgentCard`) to preserve directory
  density per the design language — see DECISIONS.md §16.
- **Optional "Following feed" not built** (explicitly optional; deferred).

## Phase 4c — Verification
- **Security gate PASSED (automated, real sessions):** signed in as user A,
  A can like/follow/bookmark as itself; A **cannot** insert any interaction with
  `actor_id = B` (RLS `42501` on likes/follows/bookmarks); A **cannot** delete
  B's like (0 rows, B's row intact); **anon** cannot write at all (`42501`).
- **Toggle correctness (automated, real session):** toggle on → `active=true`,
  count +1, row persists on re-read; toggle off → `active=false`, count back to
  baseline, row gone. Idempotent; **counts reflect reality.**
- **Machine surfaces unchanged:** `/llms.txt` (no-store, 0 interaction words),
  markdown twin (0 interaction words) — interactions are human-only.
- **Signed-out:** profile/feed/search render the islands in raw HTML with the
  liked/bookmarked/following state false; `/bookmarks` → 307 `/login`. Public +
  machine pages unaffected.
- `npm run typecheck` exit 0; `npm run build` exit 0 (all list routes `ƒ`,
  `/bookmarks` present).
- **PENDING (manual, production):** a real signed-in click-through (follow /
  like / bookmark persist across reload; optimistic rollback) — yours to run,
  like the 4a/4b human gates.

## Phase 4b — human gate PASSED (2026-06-22)
`@samarth` created a real agent in the production dashboard — **Atlas Briefing
Agent** (`atlas-briefing-agent`) — and it rendered four ways live: HTML profile +
valid `SoftwareApplication` JSON-LD, `text/markdown` twin, listed in `/agents`,
and `/llms.txt` ticked **20 → 21**. Then published a `benchmark` work-sample whose
proof block renders in the profile (evidence grid), the markdown twin, and the
feed. Migration `0003` applied. End-to-end authenticated publishing works.

## Phase 4b — Done
- **DAL writes** (only DB access, run under the user's session — RLS owner-scoped):
  `createAgent`, `updateAgent`, `createPost`, plus `getAgentById`. Return a
  `WriteResult` so slug conflicts / RLS denials are friendly messages, not throws.
  **Secret key never used in any write path** (admin client imported only by seed).
- **Migration `0003`** (additive): `agents.pricing` + `agents.model_info` (text).
  Owner-write RLS already existed from `0001` — no new policy.
- **Dashboard** (`(dashboard)` group, auth-gated layout → /login or /onboarding):
  `/dashboard` lists your agents; `/dashboard/agents/new` (create),
  `/dashboard/agents/[id]/edit` (owner-only), `/dashboard/agents/[id]/posts/new`
  (publish work-sample). Server-action forms, server-side validation, slug
  auto/unique. New agents `status=active`. `/submit` now redirects to `/dashboard`.
- **Renderers** show pricing/model_info (markdown, JSON-LD, profile header).

## Phase 4b — Verification
- **RLS negative test PASSED:** anon agent insert → 401 `42501`; anon agent
  update → 0 rows (atlas name unchanged); anon post insert → 401 `42501`.
- Dashboard routes redirect to /login when signed out; `/submit` → `/dashboard`.
- Public + machine pages unchanged logged-out (/ 200, /llms.txt 20, profile 200).
- `typecheck` + `build` clean.
- **Human gate PASSED on production (2026-06-22)** — see the "human gate" note at
  the top: real agent created + work-sample published, rendering four ways.

## Phase 4a — Done (Google OAuth + onboarding via @supabase/ssr)
- **Prereq gate passed:** confirmed Google provider enabled in Supabase
  (`/auth/v1/settings` → `google: true`) before building.
- **Cookie-aware clients:** `lib/supabase/server.ts` (async, PKCE cookie session,
  publishable key; anon fallback for scripts), `client.ts` (browser),
  `lib/supabase/middleware.ts` + root `middleware.ts` (per-request session
  refresh). Read DAL now awaits the cookie-aware server client. Secret key stays
  seed-only — never in the auth flow.
- **Sign-in:** `/login` + `signInWithGoogle` server action → `/auth/callback`
  (`exchangeCodeForSession`, sets cookies) → onboarding if no profile, else home.
  Sign-out server action.
- **Onboarding** `/onboarding`: signed-in + no profile → collects unique handle +
  display name, inserts under the existing `profiles` self-RLS (no new migration);
  `23505` → friendly "handle taken"; name/avatar prefilled from Google.
- **Nav** shows account state (@handle / "Finish setup" + Sign out) when logged in,
  "Sign in" when logged out. `/submit` stays a placeholder.

## Phase 4a — Verification
- Logged-out: /, /agents, /feed, /u/[handle] all 200 with content; nav shows
  "Sign in"; /llms.txt still 20; markdown twin 200. Auth is additive.
- /login renders "Continue with Google"; /onboarding (no session) → 307 /login;
  /auth/callback (no code) → 307 /login?error=missing_code.
- **RLS proven:** anon SELECT profiles works; anon INSERT → 401 `42501` (RLS
  reject); anon UPDATE other profile → 0 rows; target bio unchanged.
- `typecheck` + `build` clean; middleware compiled.
- **PENDING (manual, production):** a real Google sign-in end-to-end — yours to run.

## Phase 3b-ii — Done (reusing the 3b-i component library)
- **Landing `/`** — thesis hero, what-it-is, featured agents (real `listAgents`),
  CTAs (Explore directory / Submit). force-dynamic.
- **Feed `/feed`** — `getFeed` + agent map → WorkSampleCards. force-dynamic.
- **Directory `/agents`** — `listAgents` → AgentCards, with a **query-param
  capability filter** (`?capability=`) and pagination (`?page=`) — all SSR,
  shareable, crawlable. force-dynamic.
- **Search `/search?q=`** — `searchAgents` + new `searchPosts` → AgentCards +
  WorkSampleCards; nav SearchBar navigates here; prefilled SearchBar. force-dynamic.
- **Operator `/u/[handle]`** — `getProfileByHandle` + new `listAgentsByOwner` →
  operator header + their AgentCards. **Clears the /u/[handle] 404s.**
- **`/sitemap.xml`** (dynamic, pure `toSitemap`): all static routes + 20 agents
  (lastmod = updated_at) + 8 operators. **`/robots.txt`** allows indexing, points
  to the sitemap, references /llms.txt.
- **New DAL functions** (lib/data, still the only DB access): `searchPosts`,
  `listAgentsByOwner`, `listProfiles`.
- **Nav wired**: Feed→/feed, Directory→/agents, Operators→/operators (real index
  via `listProfiles`), Docs→/docs (minimal about/for-agents page), Submit→/submit
  (placeholder — real publishing is the auth phase). Button now routes internal
  hrefs through next/link.
- **Proof refinement** carried from 3b-i: nested-group string children carry the
  group label (`baseline: GPT-class RAG baseline`, not an orphaned `name`).

## Phase 3b-ii — Verification (local)
- Every page 200s with content in raw HTML. Directory `?capability=sql-generation`
  → QueryWeaver in, Atlas out. `?q=sql` → QueryWeaver + MigrateMate; `?q=citation`
  → Atlas + CiteGuard + post hits. `/u/lumen-labs` resolves with its agents.
- `sitemap.xml` well-formed, 33 urls (20 agents + 8 operators + 5 routes);
  `robots.txt` points to it. `/llms.txt` still 20 (no regression).
- `npm run typecheck` exit 0; `npm run build` exit 0; all list routes are `ƒ`.

## Phase 3b-i — polish (2026-06-21): WorkSampleCard proof block
- **Reworked `formatProof`** (`components/format.ts`) from a flat JSON-dump into a
  designed, generic credential: numeric leaves → a 2-column **evidence grid**
  (de-pathed labels; nested groups like `baseline`/`before`/`after` carry the
  group name as a small note, not a `group.child` dotted key); a `metrics:{…}`
  container leads; strings/urls/arrays → a secondary, de-emphasized **context**
  row. Still shows the full proof. No hardcoded agent fields.
- **Mobile fix:** the card's agent name now wraps instead of truncating at ~390px,
  so identity is never cut.
- Verified Atlas (nested metrics/baseline/before-after), Sentinel Ops, and
  LedgerLens (flat, different keys) all render cleanly; no dotted keys in visible
  output; typecheck + build clean; production eyeballed.

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

## Next up — Phase 4 (Auth), per PLAN.md
- Supabase Auth + Google OAuth (server-side, middleware token refresh);
  onboarding (handle/display name); operator dashboard (create/edit agent,
  publish work-sample); enforce RLS end-to-end; follow/bookmark/like.
- Replaces the `/submit` placeholder with the real publishing flow.

## Blocked / needs you
- Your review of 3b-ii (live: https://agentscape-kappa.vercel.app).
- A quick 390px eyeball (no-horizontal-scroll) on landing/feed/directory.
- For full migration automation later, a Postgres connection string
  (`DATABASE_URL`) would let `psql`/CLI apply migrations without the dashboard.
