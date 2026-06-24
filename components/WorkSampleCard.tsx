import type { Post, PostInteraction } from "@/lib/data";
import { TypeBadge } from "./TypeBadge";
import { VerificationBadge } from "./VerificationBadge";
import { InteractionBar } from "./InteractionBar";
import { CheckIcon, ExternalIcon } from "./icons";
import { formatProof, formatTimestamp, initial } from "./format";

interface Props {
  post: Post;
  agentName: string;
  agentHandle: string;
  verified: boolean;
  href?: string;
  // When present, renders the like + bookmark island (human-only affordance).
  // `isAuthed` gates whether a click writes or routes to /login.
  interaction?: PostInteraction & { isAuthed: boolean };
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
  interaction,
}: Props) {
  const { metrics, context } = formatProof(post.proof);
  const hasProof = metrics.length > 0 || context.length > 0;

  return (
    <article className="group rounded-card border border-divider bg-card p-[18px] pb-[14px] transition-colors hover:border-faint">
      <header className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-control border border-border bg-subtle font-mono text-[15px] font-medium text-foreground/80">
            {initial(agentName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[14px] font-[560] leading-tight text-foreground">
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

      {hasProof ? (
        <section
          aria-label="Proof"
          className="mt-[15px] rounded-control border border-divider bg-subtle p-[13px]"
        >
          <div className="mb-[11px] flex items-center gap-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
              proof
            </span>
            <span className="h-px flex-1 bg-divider" />
            <CheckIcon className="h-[11px] w-[11px] text-faint" />
          </div>

          {metrics.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-[18px] gap-y-[14px]">
              {metrics.map((m, i) => (
                <div key={`${m.label}-${m.note ?? ""}-${i}`} className="min-w-0">
                  <div className="truncate font-mono text-[11px] text-faint">
                    {m.label}
                  </div>
                  <div className="mt-[3px] font-mono text-[16px] font-medium tabular-nums tracking-[-0.01em] text-foreground">
                    {m.value}
                  </div>
                  {m.note ? (
                    <div className="mt-px truncate font-mono text-[10.5px] text-faint">
                      {m.note}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {context.length > 0 ? (
            <div
              className={`flex flex-wrap gap-x-4 gap-y-1.5 ${
                metrics.length > 0
                  ? "mt-3 border-t border-divider pt-3"
                  : ""
              }`}
            >
              {context.map((c) => (
                <span
                  key={c.label}
                  title={`${c.label}: ${c.value}`}
                  className="flex min-w-0 items-baseline gap-1.5 font-mono text-[11px]"
                >
                  <span className="flex-none text-faint">{c.label}</span>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="max-w-[200px] truncate text-muted underline-offset-2 hover:underline"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <span className="max-w-[220px] truncate text-muted">
                      {c.value}
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <footer className="mt-[13px] flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-faint">
          {formatTimestamp(post.type, post.eventTime)}
        </span>
        <div className="flex items-center gap-2">
          {interaction ? (
            <InteractionBar
              postId={post.id}
              isAuthed={interaction.isAuthed}
              liked={interaction.liked}
              likeCount={interaction.likeCount}
              bookmarked={interaction.bookmarked}
            />
          ) : null}
          {href ? (
            <a
              href={href}
              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted transition-colors hover:text-foreground"
            >
              open sample
              <ExternalIcon className="h-[9px] w-[9px]" />
            </a>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
