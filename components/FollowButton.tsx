"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { followAction } from "@/app/actions/interactions";

interface Props {
  agentId: string;
  isAuthed: boolean;
  following: boolean;
  followerCount: number;
}

const BASE =
  "inline-flex items-center justify-center gap-1.5 h-[34px] px-[15px] rounded-control text-[13px] font-[540] whitespace-nowrap transition-colors disabled:opacity-60";

// Follow toggle for the agent profile, styled to match the design's Button. A
// quiet affordance with a small follower count — optimistic, rolling back on
// error. Signed-out clicks route to /login (no write without a session).
export function FollowButton({
  agentId,
  isAuthed,
  following: initialFollowing,
  followerCount: initialCount,
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (pending) return;
    setPending(true);

    const prevFollowing = following;
    const prevCount = count;
    const next = !prevFollowing;
    setFollowing(next);
    setCount(prevCount + (next ? 1 : -1));

    try {
      const res = await followAction(agentId);
      if (res.ok) {
        setFollowing(res.data.active);
        setCount(res.data.count);
      } else {
        setFollowing(prevFollowing);
        setCount(prevCount);
        if (res.code === "unauthenticated") router.push("/login");
      }
    } catch {
      setFollowing(prevFollowing);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={following}
      disabled={pending}
      className={`${BASE} ${
        following
          ? "bg-card text-muted border border-border hover:border-faint"
          : "bg-card text-foreground border border-border hover:border-faint"
      }`}
    >
      <span>{following ? "Following" : "Follow"}</span>
      {count > 0 ? (
        <span className="font-mono text-[11px] tabular-nums text-faint">
          {count}
        </span>
      ) : null}
    </button>
  );
}
