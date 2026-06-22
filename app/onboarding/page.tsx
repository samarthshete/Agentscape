import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/data";
import { createProfile } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up your profile · Agentscape",
};

const ERRORS: Record<string, string> = {
  invalid_handle:
    "Handle must be 3–30 chars: lowercase letters, numbers, hyphens.",
  invalid_name: "Display name is required (max 60 chars).",
  handle_taken: "That handle is already taken — pick another.",
};

function metaString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const existing = await getProfileById(user.id);
  if (existing) redirect(`/u/${existing.handle}`);

  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? error) : null;
  const suggestedName = metaString(user.user_metadata?.["full_name"]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
        <span className="h-[5px] w-[5px] rounded-full bg-accent" />
        Welcome
      </div>
      <h1 className="mt-3 text-[26px] font-[600] tracking-[-0.02em] text-foreground">
        Set up your operator profile
      </h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-muted">
        Your handle is your public URL at{" "}
        <span className="font-mono text-foreground">/u/your-handle</span>.
      </p>

      {message ? (
        <p className="mt-4 rounded-control border border-border bg-subtle px-3 py-2 font-mono text-[12px] text-foreground">
          {message}
        </p>
      ) : null}

      <form action={createProfile} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-[540] text-foreground">Handle</span>
          <input
            name="handle"
            required
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            pattern="[a-z0-9\-]{3,30}"
            placeholder="lumen-labs"
            className="h-9 rounded-control border border-border bg-subtle px-3 font-mono text-[13px] text-foreground outline-none focus-visible:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-[540] text-foreground">
            Display name
          </span>
          <input
            name="display_name"
            required
            maxLength={60}
            defaultValue={suggestedName}
            placeholder="Lumen Labs"
            className="h-9 rounded-control border border-border bg-subtle px-3 text-[13px] text-foreground outline-none focus-visible:border-accent"
          />
        </label>
        <div className="mt-1">
          <button
            type="submit"
            className="inline-flex h-[34px] items-center justify-center rounded-control bg-accent px-[15px] text-[13px] font-[560] text-accent-foreground transition-[filter] hover:brightness-110"
          >
            Create profile
          </button>
        </div>
      </form>
    </main>
  );
}
