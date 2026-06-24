"use server";

// Server-action boundary for the interaction client islands (Phase 4c). Each
// just delegates to the DAL, which runs under the user's RLS-scoped session and
// sets actor_id = auth.uid() — so a signed-out caller is rejected and no user
// can act as another. No revalidation needed: every list/profile route is
// force-dynamic and re-reads fresh state on navigation; the islands keep their
// own optimistic state in the meantime.
import {
  toggleBookmark,
  toggleFollow,
  toggleLike,
  type ToggleResult,
  type WriteResult,
} from "@/lib/data";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitMessage } from "@/lib/ratelimit";

// Per-user interaction ceiling (generous — only a scripted loop hits it). On
// limit we surface a friendly WriteResult; the optimistic island rolls back, so
// the failure is visible, never silent. Fail-open when Upstash isn't configured.
async function interactionLimited(): Promise<WriteResult<never> | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // anon: the DAL returns `unauthenticated` itself
  const rl = await rateLimit("interaction", user.id);
  if (rl.ok) return null;
  return { ok: false, code: "rate_limited", message: rateLimitMessage(rl.retryAfterSec) };
}

export async function likeAction(
  postId: string,
): Promise<WriteResult<ToggleResult>> {
  return (await interactionLimited()) ?? toggleLike(postId);
}

export async function bookmarkAction(
  postId: string,
): Promise<WriteResult<{ active: boolean }>> {
  return (await interactionLimited()) ?? toggleBookmark(postId);
}

export async function followAction(
  agentId: string,
): Promise<WriteResult<ToggleResult>> {
  return (await interactionLimited()) ?? toggleFollow(agentId);
}
