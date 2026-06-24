"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookmarkAction, likeAction } from "@/app/actions/interactions";
import { HeartIcon, BookmarkIcon } from "./icons";

interface Props {
  postId: string;
  isAuthed: boolean;
  liked: boolean;
  likeCount: number;
  bookmarked: boolean;
}

// Thin client island on the work-sample card: like + bookmark. Understated by
// design — small mono affordances, not engagement bait. Clicks update instantly
// and roll back if the server write fails; a signed-out click routes to /login
// (no write is ever attempted without a session — RLS would reject it anyway).
export function InteractionBar({
  postId,
  isAuthed,
  liked: initialLiked,
  likeCount: initialLikeCount,
  bookmarked: initialBookmarked,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likePending, setLikePending] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  async function onLike() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (likePending) return;
    setLikePending(true);

    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    // Optimistic.
    setLiked(nextLiked);
    setLikeCount(prevCount + (nextLiked ? 1 : -1));

    try {
      const res = await likeAction(postId);
      if (res.ok) {
        // Reconcile with the authoritative count.
        setLiked(res.data.active);
        setLikeCount(res.data.count);
      } else {
        setLiked(prevLiked);
        setLikeCount(prevCount);
        if (res.code === "unauthenticated") router.push("/login");
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikePending(false);
    }
  }

  async function onBookmark() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (bookmarkPending) return;
    setBookmarkPending(true);

    const prev = bookmarked;
    setBookmarked(!prev); // optimistic

    try {
      const res = await bookmarkAction(postId);
      if (res.ok) {
        setBookmarked(res.data.active);
      } else {
        setBookmarked(prev);
        if (res.code === "unauthenticated") router.push("/login");
      }
    } catch {
      setBookmarked(prev);
    } finally {
      setBookmarkPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        aria-label={liked ? "Unlike work-sample" : "Like work-sample"}
        className={`inline-flex items-center gap-1.5 rounded-control px-2 py-1 font-mono text-[11px] transition-colors ${
          liked
            ? "text-verified"
            : "text-faint hover:text-foreground"
        }`}
      >
        <HeartIcon
          className="h-[13px] w-[13px]"
          fill={liked ? "currentColor" : "none"}
        />
        {likeCount > 0 ? (
          <span className="tabular-nums">{likeCount}</span>
        ) : null}
      </button>

      <button
        type="button"
        onClick={onBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark" : "Save work-sample"}
        className={`inline-flex items-center rounded-control px-2 py-1 transition-colors ${
          bookmarked ? "text-foreground" : "text-faint hover:text-foreground"
        }`}
      >
        <BookmarkIcon
          className="h-[13px] w-[13px]"
          fill={bookmarked ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
}
