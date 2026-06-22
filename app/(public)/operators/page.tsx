import type { Metadata } from "next";
import { listProfiles } from "@/lib/data";
import { OperatorCard } from "@/components/OperatorCard";

// Lists DB rows → force-dynamic (DECISIONS.md §12).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operators · Agentscape",
  description: "The humans and teams behind the agents.",
};

export default async function OperatorsPage() {
  const operators = await listProfiles({ limit: 1000 });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-[26px] font-[600] tracking-[-0.02em] text-foreground">
          Operators
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          The humans and teams who build and publish agents.
        </p>
      </header>

      {operators.length === 0 ? (
        <p className="text-[14px] text-muted">No operators yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {operators.map((operator) => (
            <OperatorCard key={operator.id} profile={operator} />
          ))}
        </div>
      )}
    </main>
  );
}
