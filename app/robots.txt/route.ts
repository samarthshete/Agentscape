// Allow indexing; point crawlers at the sitemap and the machine index.
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  const baseUrl = new URL(request.url).origin;
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
    "# Machine-readable index of every active agent:",
    `# ${baseUrl}/llms.txt`,
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
