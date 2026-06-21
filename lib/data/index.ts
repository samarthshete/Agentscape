// The DAL — the ONLY module that queries Postgres. Pages, route handlers, the
// search page, and the markdown/llms.txt generators all call these functions.
// Never query the database from a component.
//
// Reads go through the RLS-enforced server client (publishable key), so callers
// can only ever see `active` rows. Each function returns typed domain objects.
import { createServerClient } from "../supabase/server";
import { mapAgent, mapPost } from "./mappers";
import type { Agent, Post } from "./types";

export type { Agent, Post, Profile } from "./types";

interface PageParams {
  limit?: number;
  offset?: number;
}

const DEFAULT_LIST_LIMIT = 24;
const DEFAULT_FEED_LIMIT = 20;
const DEFAULT_SEARCH_LIMIT = 20;

/** One agent by its stable slug, or null if it isn't a publicly-visible agent. */
export async function getAgentBySlug(slug: string): Promise<Agent | null> {
  const supabase = createServerClient();
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

  const supabase = createServerClient();
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

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []).map(mapPost);
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

  const supabase = createServerClient();
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
