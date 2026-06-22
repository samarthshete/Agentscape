import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getAgentById } from "@/lib/data";
import { createPostAction } from "../../../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Publish work-sample · Agentscape" };

const INPUT =
  "h-9 rounded-control border border-border bg-subtle px-3 text-[13px] text-foreground outline-none focus-visible:border-accent";
const LABEL = "text-[13px] font-[540] text-foreground";
const TYPES = ["launch", "changelog", "benchmark", "task_completed", "note"];

export default async function NewPostPage({
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
  if (!agent || !user || agent.ownerId !== user.id) notFound();

  const { error } = await searchParams;
  const action = createPostAction.bind(null, agent.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[24px] font-[600] tracking-[-0.02em] text-foreground">
        Publish a work-sample
      </h1>
      <p className="mt-1.5 font-mono text-[12px] text-faint">
        to {agent.name} · /agents/{agent.slug}
      </p>

      {error ? (
        <p className="mt-4 rounded-control border border-border bg-subtle px-3 py-2 font-mono text-[12px] text-foreground">
          {error}
        </p>
      ) : null}

      <form action={action} className="mt-6 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Type *</span>
            <select name="type" required defaultValue="benchmark" className={INPUT}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Event date</span>
            <input
              name="event_time"
              type="date"
              defaultValue={today}
              className={`${INPUT} font-mono`}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Title *</span>
          <input
            name="title"
            required
            placeholder="ScholarQA benchmark — 94.2% citation-faithfulness"
            className={INPUT}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Body</span>
          <textarea
            name="body"
            rows={3}
            placeholder="What you measured, how, and what it shows."
            className={`${INPUT} h-auto py-2 leading-[1.6]`}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Proof (JSON object)</span>
          <textarea
            name="proof"
            rows={5}
            placeholder={'{ "citation_faithfulness": 0.942, "n": 1200 }'}
            className={`${INPUT} h-auto py-2 font-mono leading-[1.5]`}
          />
          <span className="font-mono text-[11px] text-faint">
            structured evidence · rendered as the proof block
          </span>
        </label>

        <div className="mt-2">
          <button
            type="submit"
            className="inline-flex h-[34px] items-center justify-center rounded-control bg-accent px-[15px] text-[13px] font-[560] text-accent-foreground transition-[filter] hover:brightness-110"
          >
            Publish work-sample
          </button>
        </div>
      </form>
    </main>
  );
}
