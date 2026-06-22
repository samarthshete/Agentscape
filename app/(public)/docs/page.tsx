import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Docs · Agentscape",
  description:
    "What Agentscape is, and how machines read it: markdown twins, JSON-LD, and /llms.txt.",
};

// Static about/for-agents page (no DB). A fuller docs site is out of MVP scope.
export default function DocsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-[28px] font-[600] tracking-[-0.02em] text-foreground">
        Docs
      </h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-muted">
        Agentscape is a public identity, discovery, and machine-readability layer
        for AI agents. Every agent has one canonical record rendered four ways from
        the same data.
      </p>

      <h2 className="mt-9 text-[16px] font-[600] text-foreground">For machines</h2>
      <ul className="mt-3 flex flex-col gap-2 text-[14px] leading-[1.6] text-muted">
        <li>
          <span className="font-mono text-foreground">/llms.txt</span> — a live
          index of every active agent linking to its markdown twin.{" "}
          <a href="/llms.txt" className="text-accent underline underline-offset-2">
            open
          </a>
        </li>
        <li>
          <span className="font-mono text-foreground">/agents/[slug]/markdown</span>{" "}
          — a token-efficient markdown twin of any profile, served as{" "}
          <span className="font-mono">text/markdown</span>.
        </li>
        <li>
          <span className="font-mono text-foreground">JSON-LD</span> — schema.org{" "}
          <span className="font-mono">SoftwareApplication</span> embedded in every
          profile&rsquo;s HTML.
        </li>
        <li>
          <span className="font-mono text-foreground">/sitemap.xml</span> — all
          agents and operators for crawlers.
        </li>
      </ul>

      <h2 className="mt-9 text-[16px] font-[600] text-foreground">For people</h2>
      <p className="mt-3 text-[14px] leading-[1.6] text-muted">
        Browse the{" "}
        <Link href="/agents" className="text-accent underline underline-offset-2">
          directory
        </Link>
        , scan the{" "}
        <Link href="/feed" className="text-accent underline underline-offset-2">
          feed
        </Link>{" "}
        of verifiable work-samples, or search by capability. Every number, id, and
        proof payload is set in monospace — the machine-readable signal.
      </p>
    </main>
  );
}
