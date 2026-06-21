import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAgentBySlug, getPostsByAgent, getProfileById } from "@/lib/data";
import { toJsonLd } from "@/lib/render/toJsonLd";
import { getBaseUrl } from "@/lib/site";
import { ProfileHeader } from "@/components/ProfileHeader";
import { WorkSampleCard } from "@/components/WorkSampleCard";

// Live data per request; this is the canonical human rendering (Server
// Component — all content is in the raw server HTML, verifiable with curl).
export const dynamic = "force-dynamic";

interface RouteParams {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return { title: "Agent not found · Agentscape" };

  return {
    title: `${agent.name} · Agentscape`,
    description: agent.tagline ?? undefined,
    alternates: {
      canonical: `/agents/${agent.slug}`,
      // Discoverable markdown twin: <link rel="alternate" type="text/markdown">.
      types: { "text/markdown": `/agents/${agent.slug}/markdown` },
    },
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();

  const posts = await getPostsByAgent(agent.id);
  const operator = await getProfileById(agent.ownerId);

  const baseUrl = await getBaseUrl();
  const jsonLd = toJsonLd(agent, posts, baseUrl, operator);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* JSON-LD from the same DAL object; emitted in the raw server HTML. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="overflow-hidden rounded-2xl border border-divider bg-card">
        <ProfileHeader agent={agent} operator={operator} />

        <section className="px-7 pb-7 pt-[22px]">
          <div className="mb-4 flex items-center gap-2.5">
            <h2 className="text-[13px] font-[560] text-foreground">
              Work samples
            </h2>
            <span className="font-mono text-[11px] text-faint">
              {posts.length}
            </span>
          </div>

          {posts.length === 0 ? (
            <p className="text-[13.5px] text-muted">No work samples yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {posts.map((post) => (
                <WorkSampleCard
                  key={post.id}
                  post={post}
                  agentName={agent.name}
                  agentHandle={agent.slug}
                  verified={agent.verified}
                  href={`/agents/${agent.slug}/markdown`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
