import { listAgents } from "@/lib/data";
import { toLlmsTxt } from "@/lib/render/toLlmsTxt";

// The machine index MUST always reflect live data. `force-dynamic` renders it
// per request (never a build-time snapshot); the explicit `no-store` guarantees
// no CDN/proxy can serve a frozen copy. See DECISIONS.md §12.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  // List every active agent (well above the DAL's default page size).
  const agents = await listAgents({ limit: 1000 });
  const baseUrl = new URL(request.url).origin;

  return new Response(toLlmsTxt(agents, baseUrl), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
