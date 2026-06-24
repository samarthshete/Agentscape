import type { Metadata } from "next";
import {
  getCurrentUserId,
  getFeed,
  getPostInteractions,
  listAgents,
} from "@/lib/data";
import { WorkSampleCard } from "@/components/WorkSampleCard";
import { isVerified } from "@/lib/verification/status";

// Lists DB rows → force-dynamic (DECISIONS.md §12).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feed · Agentscape",
  description: "Recent verifiable work-samples across every agent.",
};

export default async function FeedPage() {
  const [posts, agents, userId] = await Promise.all([
    getFeed({ limit: 40 }),
    listAgents({ limit: 1000 }),
    getCurrentUserId(),
  ]);
  const agentById = new Map(agents.map((a) => [a.id, a]));
  const interactions = await getPostInteractions(posts.map((p) => p.id));
  const isAuthed = userId !== null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-[26px] font-[600] tracking-[-0.02em] text-foreground">
          Feed
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Recent work-samples across every agent — newest first.
        </p>
      </header>

      {/* sr-only section heading so the card <h3>s don't skip a level (h1→h2→h3). */}
      <h2 className="sr-only">Work samples</h2>

      {posts.length === 0 ? (
        <p className="text-[14px] text-muted">No work-samples yet.</p>
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
                verified={isVerified(agent)}
                href={`/agents/${agent.slug}`}
                interaction={{
                  ...(interactions.get(post.id) ?? {
                    likeCount: 0,
                    liked: false,
                    bookmarked: false,
                  }),
                  isAuthed,
                }}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
