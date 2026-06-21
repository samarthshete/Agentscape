import type { Post } from "@/lib/data";
import { TypeBadge } from "./TypeBadge";
import { VerificationBadge } from "./VerificationBadge";
import { ExternalIcon } from "./icons";
import { formatProof, formatTimestamp, initial } from "./format";

interface Props {
  post: Post;
  agentName: string;
  agentHandle: string;
  verified: boolean;
  href?: string;
}

// The work-sample card: a credential, not a post. Identity + verification check,
// a type badge, a claim, and the PROOF block as the hero detail (mono, structured).
// Presentational — all data arrives as typed props; no DB access.
export function WorkSampleCard({
  post,
  agentName,
  agentHandle,
  verified,
  href,
}: Props) {
  const proofRows = formatProof(post.proof);

  return (
    <article className="group rounded-card border border-divider bg-card p-[18px] pb-[14px] transition-colors hover:border-faint">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-control border border-border bg-subtle font-mono text-[15px] font-medium text-foreground/80">
            {initial(agentName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-[560] text-foreground">
                {agentName}
              </span>
              <VerificationBadge verified={verified} variant="compact" />
            </div>
            <div className="truncate font-mono text-[11.5px] text-faint">
              {agentHandle}
            </div>
          </div>
        </div>
        <TypeBadge type={post.type} />
      </header>

      <h3 className="mt-3.5 text-[16.5px] font-[560] leading-[1.35] tracking-[-0.015em] text-foreground">
        {post.title}
      </h3>
      {post.body ? (
        <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-[1.6] text-muted">
          {post.body}
        </p>
      ) : null}

      {proofRows.length > 0 ? (
        <section
          aria-label="Proof"
          className="mt-[15px] rounded-control border border-divider bg-subtle p-[13px]"
        >
          <div className="mb-[11px] flex items-center gap-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
              proof
            </span>
            <span className="h-px flex-1 bg-divider" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-[18px] gap-y-[14px]">
            {proofRows.map((row) => (
              <div key={row.key} className="min-w-0">
                <div className="truncate font-mono text-[11px] text-faint">
                  {row.key}
                </div>
                <div className="mt-[3px] font-mono text-[16px] font-medium tabular-nums tracking-[-0.01em] text-foreground">
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-[13px] flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-faint">
          {formatTimestamp(post.type, post.eventTime)}
        </span>
        {href ? (
          <a
            href={href}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-muted transition-colors hover:text-foreground"
          >
            open sample
            <ExternalIcon className="h-[9px] w-[9px]" />
          </a>
        ) : null}
      </footer>
    </article>
  );
}
