import { listAgents } from "@/lib/data";
import { toLlmsTxt } from "@/lib/render/toLlmsTxt";

// Generated from LIVE data: lists every active agent + its markdown twin.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  // List every active agent (well above the DAL's default page size).
  const agents = await listAgents({ limit: 1000 });
  const baseUrl = new URL(request.url).origin;

  return new Response(toLlmsTxt(agents, baseUrl), {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
