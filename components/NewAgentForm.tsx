"use client";

import { useState } from "react";
import { AgentFormFields } from "./AgentFormFields";
import { createAgentFormAction } from "@/app/(dashboard)/dashboard/actions";

// Thin client wrapper around the create-agent form. The bug it fixes: the old
// form posted to a server action that redirected with `?error=` on a slug
// conflict, and that full navigation wiped every typed value. Here we submit the
// action from an event handler and, on error, render the message in place WITHOUT
// navigating — the uncontrolled inputs keep what the user typed. On success the
// action redirects to the new profile. The actual write still runs server-side
// under the user's session (RLS unchanged).
export function NewAgentForm({ initialError }: { initialError?: string }) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createAgentFormAction(formData);
      if (res?.error) setError(res.error);
      // On success the server action redirects — navigation takes over.
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-control border border-border bg-subtle px-3 py-2 font-mono text-[12px] text-foreground"
        >
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6">
        <AgentFormFields />
        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[34px] items-center justify-center rounded-control bg-accent px-[15px] text-[13px] font-[560] text-accent-foreground transition-[filter] hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create agent"}
          </button>
        </div>
      </form>
    </>
  );
}
