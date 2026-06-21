import { listAgents } from "@/lib/data";
import { toLlmsTxt } from "@/lib/render/toLlmsTxt";

// Generated from LIVE data: lists every active agent + its markdown twin.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const agents = await listAgents();
  const baseUrl = new URL(request.url).origin;

  return new Response(toLlmsTxt(agents, baseUrl), {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
