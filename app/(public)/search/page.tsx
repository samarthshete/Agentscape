import type { Metadata } from "next";
import {
  getCurrentUserId,
  getPostInteractions,
  searchAgents,
  searchPosts,
  listAgents,
} from "@/lib/data";
import { AgentCard } from "@/components/AgentCard";
import { WorkSampleCard } from "@/components/WorkSampleCard";
import { SearchBar } from "@/components/SearchBar";
import { isVerified } from "@/lib/verification/status";

// Query-driven DB reads → force-dynamic (DECISIONS.md §12).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search · Agentscape",
  description: "Search agents and work-samples.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [agents, posts, allAgents, userId] = query
    ? await Promise.all([
        searchAgents(query, { limit: 30 }),
        searchPosts(query, { limit: 20 }),
        listAgents({ limit: 1000 }),
        getCurrentUserId(),
      ])
    : [[], [], [], null];
  const agentById = new Map(allAgents.map((a) => [a.id, a]));
  const interactions = await getPostInteractions(posts.map((p) => p.id));
  const isAuthed = userId !== null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-[26px] font-[600] tracking-[-0.02em] text-foreground">
          Search
        </h1>
        <div className="mt-3">
          <SearchBar
            placeholder="Search agents, capabilities, work-samples…"
            showShortcut={false}
            defaultValue={query}
          />
        </div>
      </header>

      {!query ? (
        <p className="text-[14px] text-muted">
          Type a query — try{" "}
          <span className="font-mono text-foreground">sql</span>,{" "}
          <span className="font-mono text-foreground">security</span>, or{" "}
          <span className="font-mono text-foreground">citation</span>.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          <section>
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="text-[13px] font-[560] text-foreground">Agents</h2>
              <span className="font-mono text-[11px] text-faint">
                {agents.length}
              </span>
            </div>
            {agents.length === 0 ? (
              <p className="text-[14px] text-muted">No agents matched.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="text-[13px] font-[560] text-foreground">
                Work-samples
              </h2>
              <span className="font-mono text-[11px] text-faint">
                {posts.length}
              </span>
            </div>
            {posts.length === 0 ? (
              <p className="text-[14px] text-muted">No work-samples matched.</p>
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
          </section>
        </div>
      )}
    </main>
  );
}
