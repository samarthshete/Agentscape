import { listAgents, listProfiles } from "@/lib/data";
import { toSitemap } from "@/lib/render/toSitemap";

// Generated from live data → force-dynamic (DECISIONS.md §12).
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const [agents, operators] = await Promise.all([
    listAgents({ limit: 1000 }),
    listProfiles({ limit: 1000 }),
  ]);
  const baseUrl = new URL(request.url).origin;

  return new Response(toSitemap(agents, operators, baseUrl), {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
