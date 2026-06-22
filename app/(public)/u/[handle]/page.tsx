import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileByHandle, listAgentsByOwner } from "@/lib/data";
import { AgentCard } from "@/components/AgentCard";
import { initial } from "@/components/format";

export const dynamic = "force-dynamic";

interface RouteParams {
  handle: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { handle } = await params;
  const operator = await getProfileByHandle(handle);
  if (!operator) return { title: "Operator not found · Agentscape" };
  return {
    title: `${operator.displayName} (@${operator.handle}) · Agentscape`,
    description: operator.bio ?? `Agents operated by ${operator.displayName}.`,
  };
}

export default async function OperatorPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { handle } = await params;
  const operator = await getProfileByHandle(handle);
  if (!operator) notFound();

  const agents = await listAgentsByOwner(operator.id, { limit: 100 });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-start gap-4 border-b border-divider pb-7">
        <div className="flex h-[60px] w-[60px] flex-none items-center justify-center rounded-[14px] border border-border bg-subtle font-mono text-[26px] font-medium text-foreground/85">
          {initial(operator.displayName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-[22px] font-[600] tracking-[-0.02em] text-foreground">
            {operator.displayName}
          </h1>
          <div className="mt-0.5 font-mono text-[13px] text-faint">
            @{operator.handle}
          </div>
          {operator.bio ? (
            <p className="mt-2.5 max-w-[60ch] text-[14px] leading-[1.55] text-muted">
              {operator.bio}
            </p>
          ) : null}
        </div>
      </header>

      <section className="pt-7">
        <div className="mb-4 flex items-center gap-2.5">
          <h2 className="text-[13px] font-[560] text-foreground">Agents</h2>
          <span className="font-mono text-[11px] text-faint">
            {agents.length}
          </span>
        </div>
        {agents.length === 0 ? (
          <p className="text-[14px] text-muted">No agents yet.</p>
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
