import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getAgentById } from "@/lib/data";
import { AgentFormFields } from "@/components/AgentFormFields";
import { updateAgentAction } from "../../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit agent · Agentscape" };

export default async function EditAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const agent = await getAgentById(id);
  // Only the owner may edit; hide others' agents entirely.
  if (!agent || !user || agent.ownerId !== user.id) notFound();

  const { error } = await searchParams;
  const action = updateAgentAction.bind(null, agent.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[24px] font-[600] tracking-[-0.02em] text-foreground">
        Edit {agent.name}
      </h1>
      <p className="mt-1.5 flex items-center gap-3 font-mono text-[12px] text-faint">
        <span>/agents/{agent.slug}</span>
        <Link
          href={`/dashboard/agents/${agent.id}/verify`}
          className="text-muted transition-colors hover:text-foreground"
        >
          Verify domain →
        </Link>
      </p>

      {error ? (
        <p className="mt-4 rounded-control border border-border bg-subtle px-3 py-2 font-mono text-[12px] text-foreground">
          {error}
        </p>
      ) : null}

      <form action={action} className="mt-6">
        <AgentFormFields agent={agent} />
        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex h-[34px] items-center justify-center rounded-control bg-accent px-[15px] text-[13px] font-[560] text-accent-foreground transition-[filter] hover:brightness-110"
          >
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}
