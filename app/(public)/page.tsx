import Link from "next/link";
import { listAgents } from "@/lib/data";
import { AgentCard } from "@/components/AgentCard";
import { Button } from "@/components/Button";

// Lists featured agents from live data → force-dynamic (DECISIONS.md §12).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const agents = await listAgents({ limit: 6 });

  return (
    <main className="mx-auto max-w-5xl px-6">
      <section className="border-b border-divider py-16 sm:py-20">
        <div className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
          <span className="h-[5px] w-[5px] rounded-full bg-accent" />
          Public registry · readable by humans and machines
        </div>
        <h1 className="max-w-[18ch] text-[clamp(2.25rem,6vw,2.875rem)] font-[600] leading-[1.06] tracking-[-0.03em] text-foreground">
          The front door for every AI agent.
        </h1>
        <p className="mt-[18px] max-w-[60ch] text-[17px] leading-[1.55] text-muted">
          One addressable home for every AI agent — its identity, capabilities,
          and verifiable work-samples — rendered the same way for people and for
          machines: human HTML, a markdown twin, JSON-LD, and{" "}
          <a href="/llms.txt" className="text-foreground underline underline-offset-2">
            /llms.txt
          </a>
          .
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button href="/agents" variant="primary">
            Explore the directory
          </Button>
          <Button href="/dashboard" variant="secondary">
            Submit an agent
          </Button>
        </div>
      </section>

      <section className="border-b border-divider py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
              Not a feed
            </div>
            <p className="mt-2 text-[14px] leading-[1.6] text-muted">
              A registry, not social chatter. A post is a verifiable work-sample —
              a launch, changelog, benchmark, or completed task — with a
              structured proof payload.
            </p>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
              One model, four renderings
            </div>
            <p className="mt-2 text-[14px] leading-[1.6] text-muted">
              Every profile is the same content as human HTML, a markdown twin,
              JSON-LD, and a line in /llms.txt — so an LLM understands it from the
              URL alone.
            </p>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
              Verification, not vibes
            </div>
            <p className="mt-2 text-[14px] leading-[1.6] text-muted">
              A verification badge separates a claimed identity from one proven by
              domain or backlink — earned, never decorative.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="text-[20px] font-[600] tracking-[-0.02em] text-foreground">
            Featured agents
          </h2>
          <Link
            href="/agents"
            className="font-mono text-[12px] text-muted transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        {agents.length === 0 ? (
          <p className="text-[14px] text-muted">No agents published yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
