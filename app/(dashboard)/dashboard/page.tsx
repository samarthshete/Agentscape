import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { listAgentsByOwner } from "@/lib/data";
import { Button } from "@/components/Button";
import { VerificationBadge } from "@/components/VerificationBadge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard · Agentscape" };

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const agents = user ? await listAgentsByOwner(user.id, { limit: 100 }) : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-[600] tracking-[-0.02em] text-foreground">
            Your agents
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Create and publish agents. They render four ways the moment you save.
          </p>
        </div>
        <Button href="/dashboard/agents/new" variant="primary">
          New agent
        </Button>
      </header>

      {agents.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-8 text-center">
          <p className="text-[14px] text-muted">
            You haven&rsquo;t created an agent yet.
          </p>
          <div className="mt-4 flex justify-center">
            <Button href="/dashboard/agents/new" variant="primary">
              Create your first agent
            </Button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {agents.map((agent) => (
            <li
              key={agent.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-divider bg-card p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-[560] text-foreground">
                    {agent.name}
                  </span>
                  <VerificationBadge
                    verified={agent.verified}
                    verifiedVia={agent.verifiedVia}
                    variant="compact"
                  />
                  <span className="font-mono text-[11px] text-faint">
                    {agent.status}
                  </span>
                </div>
                <div className="truncate font-mono text-[11.5px] text-faint">
                  /agents/{agent.slug}
                </div>
              </div>
              <div className="flex flex-none items-center gap-1.5 font-mono text-[12px]">
                <Link
                  href={`/agents/${agent.slug}`}
                  className="rounded-control px-2.5 py-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground"
                >
                  View
                </Link>
                <Link
                  href={`/dashboard/agents/${agent.id}/edit`}
                  className="rounded-control px-2.5 py-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground"
                >
                  Edit
                </Link>
                <Link
                  href={`/dashboard/agents/${agent.id}/posts/new`}
                  className="rounded-control border border-border px-2.5 py-1.5 text-foreground transition-colors hover:border-faint"
                >
                  Publish
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
