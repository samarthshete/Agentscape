// The DAL — the ONLY module that queries Postgres. Pages, route handlers, the
// search page, and the markdown/llms.txt generators all call these functions.
// Never query the database from a component.
//
// Reads go through the RLS-enforced server client (publishable key), so callers
// can only ever see `active` rows. Each function returns typed domain objects.
import { createServerClient } from "../supabase/server";
import { mapAgent, mapPost, mapProfile } from "./mappers";
import type {
  Agent,
  AgentInput,
  AgentInteraction,
  Post,
  PostInput,
  PostInteraction,
  Profile,
  ToggleResult,
  WriteResult,
} from "./types";

export type {
  Agent,
  AgentInput,
  Post,
  PostInput,
  Profile,
  PostType,
  PostProof,
  AgentMetrics,
  WriteResult,
  PostInteraction,
  AgentInteraction,
  ToggleResult,
} from "./types";

interface PageParams {
  limit?: number;
  offset?: number;
}

const DEFAULT_LIST_LIMIT = 24;
const DEFAULT_FEED_LIMIT = 20;
const DEFAULT_SEARCH_LIMIT = 20;

/** One agent by its stable slug, or null if it isn't a publicly-visible agent. */
export async function getAgentBySlug(slug: string): Promise<Agent | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapAgent(data) : null;
}

/** Active agents, newest first, deterministically ordered and paginated. */
export async function listAgents(params: PageParams = {}): Promise<Agent[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const offset = params.offset ?? 0;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []).map(mapAgent);
}

/** Reverse-chronological work-sample feed (active posts), paginated. */
export async function getFeed(params: PageParams = {}): Promise<Post[]> {
  const limit = params.limit ?? DEFAULT_FEED_LIMIT;
  const offset = params.offset ?? 0;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("event_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

/** Active work-samples for one agent, newest event first, paginated. */
export async function getPostsByAgent(
  agentId: string,
  params: PageParams = {},
): Promise<Post[]> {
  const limit = params.limit ?? DEFAULT_FEED_LIMIT;
  const offset = params.offset ?? 0;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("agent_id", agentId)
    .order("event_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

/** One operator profile by URL handle, or null. (Profiles are public-read.) */
export async function getProfileByHandle(
  handle: string,
): Promise<Profile | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProfile(data) : null;
}

/** One operator profile by id (e.g. an agent's owner), or null. */
export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProfile(data) : null;
}

/** Full-text search over agents (name/tagline/capabilities/description). */
export async function searchAgents(
  query: string,
  params: PageParams = {},
): Promise<Agent[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const limit = params.limit ?? DEFAULT_SEARCH_LIMIT;
  const offset = params.offset ?? 0;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .textSearch("search_vector", trimmed, {
      type: "websearch",
      config: "english",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []).map(mapAgent);
}

/** Full-text search over work-sample posts (title + body). */
export async function searchPosts(
  query: string,
  params: PageParams = {},
): Promise<Post[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const limit = params.limit ?? DEFAULT_SEARCH_LIMIT;
  const offset = params.offset ?? 0;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .textSearch("search_vector", trimmed, {
      type: "websearch",
      config: "english",
    })
    .order("event_time", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []).map(mapPost);
}

/** Active agents owned by one operator, newest first. */
export async function listAgentsByOwner(
  ownerId: string,
  params: PageParams = {},
): Promise<Agent[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const offset = params.offset ?? 0;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []).map(mapAgent);
}

/** All operator profiles (public-read), deterministically ordered. */
export async function listProfiles(params: PageParams = {}): Promise<Profile[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const offset = params.offset ?? 0;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("handle", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []).map(mapProfile);
}

/** One agent by id (owner sees their own incl. drafts via RLS), or null. */
export async function getAgentById(id: string): Promise<Agent | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapAgent(data) : null;
}

// ---------------------------------------------------------------------------
// Writes. These run under the signed-in user's session (cookie + publishable
// key), so RLS enforces owner-scoping at the database. The secret/admin key is
// NEVER used here. Expected failures (slug conflict, RLS denial) are returned
// as values, not thrown.
// ---------------------------------------------------------------------------

function writeError(code: string, message: string): { ok: false; code: string; message: string } {
  return { ok: false, code, message };
}

/** Create an agent owned by the signed-in user. */
export async function createAgent(
  input: AgentInput,
): Promise<WriteResult<Agent>> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return writeError("unauthenticated", "Not signed in.");

  const { data, error } = await supabase
    .from("agents")
    .insert({
      owner_id: user.id,
      slug: input.slug,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      capabilities: input.capabilities,
      endpoint_url: input.endpointUrl,
      docs_url: input.docsUrl,
      pricing: input.pricing,
      model_info: input.modelInfo,
      metrics: input.metrics,
      status: input.status,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return writeError("slug_taken", "That slug is taken.");
    if (error.code === "42501") return writeError("forbidden", "Not allowed.");
    return writeError(error.code ?? "write_failed", error.message);
  }
  return { ok: true, data: mapAgent(data) };
}

/** Update an agent. RLS limits the update to the owner's own row. */
export async function updateAgent(
  id: string,
  input: AgentInput,
): Promise<WriteResult<Agent>> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("agents")
    .update({
      slug: input.slug,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      capabilities: input.capabilities,
      endpoint_url: input.endpointUrl,
      docs_url: input.docsUrl,
      pricing: input.pricing,
      model_info: input.modelInfo,
      metrics: input.metrics,
      status: input.status,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return writeError("slug_taken", "That slug is taken.");
    return writeError(error.code ?? "write_failed", error.message);
  }
  // RLS hides rows the user doesn't own → no row updated.
  if (!data) return writeError("forbidden", "You don't own this agent.");
  return { ok: true, data: mapAgent(data) };
}

/** Publish a work-sample to an agent. RLS requires the parent agent's owner. */
export async function createPost(
  agentId: string,
  input: PostInput,
): Promise<WriteResult<Post>> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      agent_id: agentId,
      type: input.type,
      title: input.title,
      body: input.body,
      proof: input.proof,
      event_time: input.eventTime,
      status: input.status,
    })
    .select("*")
    .single();

  if (error) {
    // RLS denies posting to an agent you don't own.
    if (error.code === "42501") return writeError("forbidden", "You don't own this agent.");
    return writeError(error.code ?? "write_failed", error.message);
  }
  return { ok: true, data: mapPost(data) };
}

// ---------------------------------------------------------------------------
// Interactions (Phase 4c) — follow / like / bookmark.
//
// Human-only affordances; never rendered on any machine surface. Like/follow
// counts are public (RLS: `using (true)`); bookmarks are self-only (RLS:
// `select` scoped to the actor), so they are private and uncounted.
//
// All writes run under the signed-in user's session and set `actor_id` to the
// caller — the database's `with check (actor_id = auth.uid())` makes it
// impossible to act as another user. Toggles are idempotent: insert-if-absent,
// delete-if-present, then read back the authoritative count.
// ---------------------------------------------------------------------------

/** The signed-in user's id, or null when logged out. (Auth, not a DB query.) */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * The current user's like/bookmark state + public like count for a set of
 * work-samples, keyed by post id. Missing posts default to a zeroed state.
 * One query for all likes (public) + one for the user's own bookmarks.
 */
export async function getPostInteractions(
  postIds: string[],
): Promise<Map<string, PostInteraction>> {
  const result = new Map<string, PostInteraction>();
  if (postIds.length === 0) return result;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const [likesRes, bookmarksRes] = await Promise.all([
    supabase.from("likes").select("post_id, actor_id").in("post_id", postIds),
    userId
      ? supabase.from("bookmarks").select("post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[], error: null }),
  ]);
  if (likesRes.error) throw likesRes.error;
  if (bookmarksRes.error) throw bookmarksRes.error;

  for (const id of postIds) {
    result.set(id, { likeCount: 0, liked: false, bookmarked: false });
  }
  for (const row of likesRes.data ?? []) {
    const entry = result.get(row.post_id);
    if (!entry) continue;
    entry.likeCount += 1;
    if (userId && row.actor_id === userId) entry.liked = true;
  }
  // bookmarks RLS already scopes the rows to the current user.
  for (const row of bookmarksRes.data ?? []) {
    const entry = result.get(row.post_id);
    if (entry) entry.bookmarked = true;
  }
  return result;
}

/** Public follower count + whether the current user follows one agent. */
export async function getAgentInteraction(
  agentId: string,
): Promise<AgentInteraction> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const [countRes, mineRes] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId),
    userId
      ? supabase
          .from("follows")
          .select("agent_id")
          .eq("agent_id", agentId)
          .eq("actor_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (countRes.error) throw countRes.error;
  if (mineRes.error) throw mineRes.error;

  return {
    followerCount: countRes.count ?? 0,
    following: Boolean(mineRes.data),
  };
}

/** Toggle the current user's like on a work-sample. Returns the new state + count. */
export async function toggleLike(
  postId: string,
): Promise<WriteResult<ToggleResult>> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return writeError("unauthenticated", "Sign in to like.");

  const { data: existing, error: readErr } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("actor_id", user.id)
    .maybeSingle();
  if (readErr) return writeError(readErr.code ?? "read_failed", readErr.message);

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("actor_id", user.id);
    if (error) return writeError(error.code ?? "write_failed", error.message);
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ post_id: postId, actor_id: user.id });
    // 23505 = already liked (raced) — treat as success, the row exists.
    if (error && error.code !== "23505") {
      if (error.code === "42501") return writeError("forbidden", "Not allowed.");
      return writeError(error.code ?? "write_failed", error.message);
    }
  }

  const { count, error: countErr } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  if (countErr) return writeError(countErr.code ?? "read_failed", countErr.message);

  return { ok: true, data: { active: !existing, count: count ?? 0 } };
}

/** Toggle the current user's bookmark on a work-sample. Private; uncounted. */
export async function toggleBookmark(
  postId: string,
): Promise<WriteResult<{ active: boolean }>> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return writeError("unauthenticated", "Sign in to save.");

  const { data: existing, error: readErr } = await supabase
    .from("bookmarks")
    .select("post_id")
    .eq("post_id", postId)
    .eq("actor_id", user.id)
    .maybeSingle();
  if (readErr) return writeError(readErr.code ?? "read_failed", readErr.message);

  if (existing) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("actor_id", user.id);
    if (error) return writeError(error.code ?? "write_failed", error.message);
  } else {
    const { error } = await supabase
      .from("bookmarks")
      .insert({ post_id: postId, actor_id: user.id });
    if (error && error.code !== "23505") {
      if (error.code === "42501") return writeError("forbidden", "Not allowed.");
      return writeError(error.code ?? "write_failed", error.message);
    }
  }

  return { ok: true, data: { active: !existing } };
}

/** Toggle the current user's follow on an agent. Returns the new state + count. */
export async function toggleFollow(
  agentId: string,
): Promise<WriteResult<ToggleResult>> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return writeError("unauthenticated", "Sign in to follow.");

  const { data: existing, error: readErr } = await supabase
    .from("follows")
    .select("agent_id")
    .eq("agent_id", agentId)
    .eq("actor_id", user.id)
    .maybeSingle();
  if (readErr) return writeError(readErr.code ?? "read_failed", readErr.message);

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("agent_id", agentId)
      .eq("actor_id", user.id);
    if (error) return writeError(error.code ?? "write_failed", error.message);
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ agent_id: agentId, actor_id: user.id });
    if (error && error.code !== "23505") {
      if (error.code === "42501") return writeError("forbidden", "Not allowed.");
      return writeError(error.code ?? "write_failed", error.message);
    }
  }

  const { count, error: countErr } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", agentId);
  if (countErr) return writeError(countErr.code ?? "read_failed", countErr.message);

  return { ok: true, data: { active: !existing, count: count ?? 0 } };
}

/**
 * The current user's bookmarked work-samples, most-recently-saved first.
 * Bookmarks are self-RLS, so this only ever returns the caller's own saves;
 * posts RLS further limits to active samples of active agents.
 */
export async function listBookmarkedPosts(
  params: PageParams = {},
): Promise<Post[]> {
  const limit = params.limit ?? DEFAULT_FEED_LIMIT;
  const offset = params.offset ?? 0;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bm, error: bmErr } = await supabase
    .from("bookmarks")
    .select("post_id, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (bmErr) throw bmErr;

  const ids = (bm ?? []).map((r) => r.post_id);
  if (ids.length === 0) return [];

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .in("id", ids);
  if (error) throw error;

  const byId = new Map((posts ?? []).map((p) => [p.id, mapPost(p)]));
  // Preserve the bookmark order (newest save first), dropping any RLS-hidden post.
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is Post => Boolean(p));
}
