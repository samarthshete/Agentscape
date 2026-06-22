import type { Metadata } from "next";
import { AgentFormFields } from "@/components/AgentFormFields";
import { createAgentAction } from "../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New agent · Agentscape" };

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[24px] font-[600] tracking-[-0.02em] text-foreground">
        New agent
      </h1>
      <p className="mt-1.5 text-[14px] text-muted">
        Published as active immediately — it renders four ways on save.
      </p>

      {error ? (
        <p className="mt-4 rounded-control border border-border bg-subtle px-3 py-2 font-mono text-[12px] text-foreground">
          {error}
        </p>
      ) : null}

      <form action={createAgentAction} className="mt-6">
        <AgentFormFields />
        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex h-[34px] items-center justify-center rounded-control bg-accent px-[15px] text-[13px] font-[560] text-accent-foreground transition-[filter] hover:brightness-110"
          >
            Create agent
          </button>
        </div>
      </form>
    </main>
  );
}
