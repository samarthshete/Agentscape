import type { Metadata } from "next";
import { listAgents } from "@/lib/data";
import { AgentCard } from "@/components/AgentCard";
import { CapabilityTag } from "@/components/CapabilityTag";

// Lists DB rows → force-dynamic (DECISIONS.md §12).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Directory · Agentscape",
  description: "Browse every AI agent, filterable by capability.",
};

const PAGE_SIZE = 12;

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ capability?: string; page?: string }>;
}) {
  const { capability, page } = await searchParams;
  const agents = await listAgents({ limit: 1000 });

  // Filter + paginate over the typed DAL result (query-param driven → SSR + shareable).
  const filtered = capability
    ? agents.filter((a) => a.capabilities.includes(capability))
    : agents;

  const allCapabilities = Array.from(
    new Set(agents.flatMap((a) => a.capabilities)),
  ).sort((a, b) => a.localeCompare(b));

  const pageNum = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(pageNum, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const pageHref = (p: number): string => {
    const params = new URLSearchParams();
    if (capability) params.set("capability", capability);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/agents?${qs}` : "/agents";
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-5">
        <h1 className="text-[26px] font-[600] tracking-[-0.02em] text-foreground">
          Directory
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          {filtered.length} {filtered.length === 1 ? "agent" : "agents"}
          {capability ? (
            <>
              {" "}
              with capability{" "}
              <span className="font-mono text-foreground">{capability}</span>
            </>
          ) : null}
          .
        </p>
      </header>

      <nav aria-label="Filter by capability" className="mb-7 flex flex-wrap gap-2">
        <CapabilityTag href="/agents" active={!capability}>
          all
        </CapabilityTag>
        {allCapabilities.map((cap) => (
          <CapabilityTag
            key={cap}
            href={`/agents?capability=${encodeURIComponent(cap)}`}
            active={cap === capability}
          >
            {cap}
          </CapabilityTag>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="text-[14px] text-muted">No agents match this filter.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between gap-4 font-mono text-[12px]"
        >
          {current > 1 ? (
            <a
              href={pageHref(current - 1)}
              className="rounded-control border border-border px-3 py-1.5 text-muted transition-colors hover:border-faint hover:text-foreground"
            >
              ← Prev
            </a>
          ) : (
            <span className="px-3 py-1.5 text-faint/50">← Prev</span>
          )}
          <span className="text-faint">
            page {current} / {totalPages}
          </span>
          {current < totalPages ? (
            <a
              href={pageHref(current + 1)}
              className="rounded-control border border-border px-3 py-1.5 text-muted transition-colors hover:border-faint hover:text-foreground"
            >
              Next →
            </a>
          ) : (
            <span className="px-3 py-1.5 text-faint/50">Next →</span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
