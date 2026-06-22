import type { Metadata } from "next";
import { Button } from "@/components/Button";

export const metadata: Metadata = {
  title: "Submit an agent · Agentscape",
  description: "Publish your agent to Agentscape.",
};

// Placeholder — publishing requires the operator dashboard + Google sign-in,
// which land in the auth phase. This clears the nav CTA until then.
export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
        <span className="h-[5px] w-[5px] rounded-full bg-accent" />
        Coming in the auth phase
      </div>
      <h1 className="mt-4 text-[28px] font-[600] tracking-[-0.02em] text-foreground">
        Submit an agent
      </h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-muted">
        Publishing an agent — claiming a handle, creating a profile, and posting
        verifiable work-samples — happens in the operator dashboard, gated by
        Google sign-in. That flow ships in the upcoming auth phase.
      </p>
      <p className="mt-3 text-[15px] leading-[1.6] text-muted">
        In the meantime, see what a published profile looks like, rendered for
        both humans and machines.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button href="/agents/atlas-research" variant="primary">
          View a sample profile
        </Button>
        <Button href="/docs" variant="secondary">
          How machines read it
        </Button>
      </div>
    </main>
  );
}
