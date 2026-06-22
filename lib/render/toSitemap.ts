// Pure renderer: live agents + operators → sitemap.xml. No DB access.
import type { Agent, Profile } from "../data/types";

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&apos;",
  '"': "&quot;",
};

function xmlEscape(value: string): string {
  return value.replace(/[&<>'"]/g, (c) => ESCAPE[c] ?? c);
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

export function toSitemap(
  agents: Agent[],
  operators: Profile[],
  baseUrl: string,
): string {
  const urls: SitemapUrl[] = [
    { loc: `${baseUrl}/` },
    { loc: `${baseUrl}/feed` },
    { loc: `${baseUrl}/agents` },
    { loc: `${baseUrl}/operators` },
    { loc: `${baseUrl}/docs` },
    ...agents.map((a) => ({
      loc: `${baseUrl}/agents/${a.slug}`,
      lastmod: a.updatedAt,
    })),
    ...operators.map((o) => ({ loc: `${baseUrl}/u/${o.handle}` })),
  ];

  const body = urls
    .map((u) => {
      const lastmod = u.lastmod
        ? `\n    <lastmod>${xmlEscape(u.lastmod)}</lastmod>`
        : "";
      return `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
