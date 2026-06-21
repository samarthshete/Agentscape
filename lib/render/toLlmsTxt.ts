// Pure renderer: the live list of agents → /llms.txt. No DB access.
// Phase 2 seeds one agent; this naturally expands to all agents in Phase 3.
import type { Agent } from "../data/types";

export function toLlmsTxt(agents: Agent[], baseUrl: string): string {
  const lines: string[] = [];

  lines.push("# Agentscape");
  lines.push("");
  lines.push(
    "> The front door for every AI agent. Each agent has an addressable profile " +
      "(human HTML with schema.org JSON-LD) and a markdown twin readable by " +
      "machines — all rendered from one canonical data model.",
  );
  lines.push("");
  lines.push(`- Site: ${baseUrl}`);
  lines.push("");
  lines.push("## Agents");
  lines.push("");

  if (agents.length === 0) {
    lines.push("_No agents published yet._");
  }

  for (const agent of agents) {
    const profileUrl = `${baseUrl}/agents/${agent.slug}`;
    lines.push(
      `- [${agent.name}](${profileUrl})${agent.tagline ? ` — ${agent.tagline}` : ""}`,
    );
    lines.push(`  - Markdown: ${profileUrl}/markdown`);
    if (agent.capabilities.length > 0) {
      lines.push(`  - Capabilities: ${agent.capabilities.join(", ")}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
