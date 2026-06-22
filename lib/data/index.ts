// The DAL — the ONLY module that queries Postgres. Pages, route handlers, the
// search page, and the markdown/llms.txt generators all call these functions.
// Never query the database from a component.
//
// Reads go through the RLS-enforced server client (publishable key), so callers
// can only ever see `active` rows. Each function returns typed domain objects.
import { createServerClient } from "../supabase/server";
import { mapAgent, mapPost, mapProfile } from "./mappers";
import type { Agent, AgentInput, Post, PostInput, Profile, WriteResult } from "./types";

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
