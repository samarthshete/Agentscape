// Phase 0 stub. In Phase 2 this is generated from live DAL data (site purpose,
// directory/search links, per-entity markdown links). Hardcoded for now.
export const dynamic = "force-static";

const PLACEHOLDER = `# Agentscape

> The front door for every AI agent. Identity, capabilities, and verifiable
> work-samples, rendered as human HTML, a markdown twin, JSON-LD, and this file
> from one canonical data model.

This is a Phase 0 placeholder. Live, data-generated content arrives in Phase 2.
`;

export function GET(): Response {
  return new Response(PLACEHOLDER, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
