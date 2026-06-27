import type { Metadata } from "next";
import { NewAgentForm } from "@/components/NewAgentForm";

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

      <NewAgentForm initialError={error} />
    </main>
  );
}
