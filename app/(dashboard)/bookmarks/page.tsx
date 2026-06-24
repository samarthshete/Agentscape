import Link from "next/link";
import type { Metadata } from "next";
import {
  getPostInteractions,
  listAgents,
  listBookmarkedPosts,
} from "@/lib/data";
import { WorkSampleCard } from "@/components/WorkSampleCard";

// Reads DB rows under the user's session (bookmarks are self-RLS) → force-dynamic.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved · Agentscape",
  description: "Work-samples you've bookmarked.",
};

export default async function SavedPage() {
  // The (dashboard) layout already gated this route to a signed-in, onboarded
  // user, so listBookmarkedPosts returns the caller's own saves.
  const [posts, agents] = await Promise.all([
    listBookmarkedPosts({ limit: 100 }),
    listAgents({ limit: 1000 }),
  ]);
  const agentById = new Map(agents.map((a) => [a.id, a]));
  const interactions = await getPostInteractions(posts.map((p) => p.id));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-[600] tracking-[-0.02em] text-foreground">
            Saved
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Work-samples you&rsquo;ve bookmarked — newest first.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-control px-2.5 py-1.5 font-mono text-[12px] text-muted transition-colors hover:bg-subtle hover:text-foreground"
        >
          Dashboard
        </Link>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-8 text-center">
          <p className="text-[14px] text-muted">
            No saved work-samples yet. Bookmark one from the{" "}
            <Link href="/feed" className="text-accent hover:underline">
              feed
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {posts.map((post) => {
            const agent = agentById.get(post.agentId);
            if (!agent) return null;
            return (
              <WorkSampleCard
                key={post.id}
                post={post}
                agentName={agent.name}
                agentHandle={agent.slug}
                verified={agent.verified}
                href={`/agents/${agent.slug}`}
                interaction={{
                  ...(interactions.get(post.id) ?? {
                    likeCount: 0,
                    liked: false,
                    bookmarked: true,
                  }),
                  isAuthed: true,
                }}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
