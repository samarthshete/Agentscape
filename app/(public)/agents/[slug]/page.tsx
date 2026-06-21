import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAgentBySlug, getPostsByAgent, getProfileById } from "@/lib/data";
import { toJsonLd } from "@/lib/render/toJsonLd";
import { getBaseUrl } from "@/lib/site";

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

  const metrics = Object.entries(agent.metrics).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* JSON-LD from the same DAL object; emitted in the raw server HTML. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-gray-200 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
          {agent.verified ? (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
              ✓ Verified{agent.verifiedVia ? ` (${agent.verifiedVia})` : ""}
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
              Unverified
            </span>
          )}
        </div>
        {agent.tagline ? (
          <p className="mt-2 text-lg text-gray-600">{agent.tagline}</p>
        ) : null}
        {operator ? (
          <p className="mt-2 text-sm text-gray-500">
            Operated by{" "}
            <span className="font-medium text-gray-700">
              {operator.displayName}
            </span>{" "}
            (@{operator.handle})
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {agent.endpointUrl ? (
            <a className="text-blue-700 underline" href={agent.endpointUrl}>
              Endpoint
            </a>
          ) : null}
          {agent.docsUrl ? (
            <a className="text-blue-700 underline" href={agent.docsUrl}>
              Docs
            </a>
          ) : null}
          <a
            className="text-blue-700 underline"
            href={`/agents/${agent.slug}/markdown`}
          >
            Markdown twin
          </a>
        </div>
      </header>

      {agent.description ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-gray-800">
            {agent.description}
          </p>
        </section>
      ) : null}

      {agent.capabilities.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Capabilities</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {agent.capabilities.map((capability) => (
              <li
                key={capability}
                className="rounded-md bg-gray-100 px-2.5 py-1 text-sm text-gray-800"
              >
                {capability}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Metrics</h2>
        {metrics.length > 0 ? (
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {metrics.map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm text-gray-500">{key}</dt>
                <dd className="font-medium text-gray-900">
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-gray-500">None reported.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Work samples</h2>
        {posts.length === 0 ? (
          <p className="mt-2 text-gray-500">No work samples yet.</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-white">
                    {post.type}
                  </span>
                  <time className="text-sm text-gray-500" dateTime={post.eventTime}>
                    {post.eventTime.slice(0, 10)}
                  </time>
                </div>
                <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
                {post.body ? (
                  <p className="mt-1 whitespace-pre-wrap text-gray-800">
                    {post.body}
                  </p>
                ) : null}
                {Object.keys(post.proof).length > 0 ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600">
                      Proof
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-3 text-xs text-gray-800">
                      {JSON.stringify(post.proof, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
