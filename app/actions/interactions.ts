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

export async function likeAction(
  postId: string,
): Promise<WriteResult<ToggleResult>> {
  return toggleLike(postId);
}

export async function bookmarkAction(
  postId: string,
): Promise<WriteResult<{ active: boolean }>> {
  return toggleBookmark(postId);
}

export async function followAction(
  agentId: string,
): Promise<WriteResult<ToggleResult>> {
  return toggleFollow(agentId);
}
