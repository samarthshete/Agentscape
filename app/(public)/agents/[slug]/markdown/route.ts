import { getAgentBySlug, getFeed } from "@/lib/data";
import { toMarkdown } from "@/lib/render/toMarkdown";

// Markdown twin — same DAL object as the HTML page, served as text/markdown.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) {
    return new Response(`# Not found\n\nNo agent at /agents/${slug}.\n`, {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const feed = await getFeed();
  const posts = feed.filter((post) => post.agentId === agent.id);
  const baseUrl = new URL(request.url).origin;

  return new Response(toMarkdown(agent, posts, baseUrl), {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
