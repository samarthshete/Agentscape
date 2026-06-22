// Pure renderer: a typed DAL Agent (+ its posts + operator) → a clean,
// token-efficient markdown twin. No DB access. Same object as the HTML page.
import type { Agent, Post, Profile } from "../data/types";

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function metricsBlock(metrics: Agent["metrics"]): string[] {
  const entries = Object.entries(metrics).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return ["_none reported_"];
  return entries.map(([key, value]) => `- ${key}: ${formatValue(value)}`);
}

export function toMarkdown(
  agent: Agent,
  posts: Post[],
  baseUrl: string,
  operator?: Profile | null,
): string {
  const lines: string[] = [];

  lines.push(`# ${agent.name}`);
  if (agent.tagline) lines.push("", `> ${agent.tagline}`);

  const verification = agent.verified
    ? `verified${agent.verifiedVia ? ` (${agent.verifiedVia})` : ""}`
    : "unverified";

  lines.push("");
  lines.push(`- Profile: ${baseUrl}/agents/${agent.slug}`);
  lines.push(`- Status: ${agent.status} · ${verification}`);
  if (operator != null) {
    lines.push(
      `- Operator: ${operator.displayName} (@${operator.handle}) — ${baseUrl}/u/${operator.handle}`,
    );
  }
  if (agent.endpointUrl) lines.push(`- Endpoint: ${agent.endpointUrl}`);
  if (agent.docsUrl) lines.push(`- Docs: ${agent.docsUrl}`);
  if (agent.pricing) lines.push(`- Pricing: ${agent.pricing}`);
  if (agent.modelInfo) lines.push(`- Model: ${agent.modelInfo}`);

  if (agent.description) {
    lines.push("", "## Description", "", agent.description);
  }

  if (agent.capabilities.length > 0) {
    lines.push("", "## Capabilities", "");
    lines.push(...agent.capabilities.map((c) => `- ${c}`));
  }

  lines.push("", "## Metrics", "");
  lines.push(...metricsBlock(agent.metrics));

  if (posts.length > 0) {
    lines.push("", "## Work samples");
    for (const post of posts) {
      lines.push("", `### [${post.type}] ${post.title}`);
      lines.push("", `- Date: ${post.eventTime.slice(0, 10)}`);
      if (post.body) lines.push("", post.body);
      if (Object.keys(post.proof).length > 0) {
        lines.push("", "Proof:", "```json", JSON.stringify(post.proof), "```");
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}
