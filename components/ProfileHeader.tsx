import type { Agent, AgentInteraction, Profile } from "@/lib/data";
import { isVerified, verifiedViaLabel } from "@/lib/verification/status";
import { Button } from "./Button";
import { FollowButton } from "./FollowButton";
import { VerificationBadge } from "./VerificationBadge";
import { CapabilityTag } from "./CapabilityTag";
import { MetricStat } from "./MetricStat";
import { CopyButton } from "./CopyButton";
import { ExternalIcon } from "./icons";
import { initial } from "./format";

// The agent profile header: avatar, name + verification, tagline, capability
// tags, primary actions, the endpoint (copyable), docs, operator attribution,
// and the metrics row. Presentational; the copy control and the follow toggle
// (when `follow` is supplied) are the only client islands.
export function ProfileHeader({
  agent,
  operator,
  follow,
}: {
  agent: Agent;
  operator: Profile | null;
  follow?: AgentInteraction & { isAuthed: boolean };
}) {
  const metrics = Object.entries(agent.metrics).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const verified = isVerified(agent);
  const via = verifiedViaLabel(agent);

  return (
    <header className="rounded-t-2xl border-b border-divider bg-gradient-to-b from-subtle to-card px-7 pb-6 pt-7">
      <div className="flex flex-wrap items-start gap-[18px]">
        <div className="flex h-[60px] w-[60px] flex-none items-center justify-center rounded-[14px] border border-border bg-subtle font-mono text-[26px] font-medium text-foreground/85">
          {initial(agent.name)}
        </div>

        <div className="min-w-[240px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-[600] tracking-[-0.02em] text-foreground">
              {agent.name}
            </h1>
            <VerificationBadge verified={verified} variant="compact" />
            <VerificationBadge
              verified={verified}
              verifiedVia={via}
              variant="pill"
            />
          </div>
          {agent.tagline ? (
            <p className="mt-[7px] max-w-[60ch] text-[14.5px] text-muted">
              {agent.tagline}
            </p>
          ) : null}
          {agent.capabilities.length > 0 ? (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {agent.capabilities.map((cap) => (
                <CapabilityTag key={cap}>{cap}</CapabilityTag>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-none flex-col gap-2">
          {agent.endpointUrl ? (
            <Button href={agent.endpointUrl} variant="primary">
              Use agent
            </Button>
          ) : null}
          {follow ? (
            <FollowButton
              agentId={agent.id}
              isAuthed={follow.isAuthed}
              following={follow.following}
              followerCount={follow.followerCount}
            />
          ) : (
            <Button variant="secondary" type="button">
              Follow
            </Button>
          )}
        </div>
      </div>

      <div className="mt-[22px] flex flex-wrap items-center gap-x-[22px] gap-y-2.5 border-t border-divider pt-[18px]">
        {agent.endpointUrl ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
              endpoint
            </span>
            <code className="inline-flex items-center gap-1.5 rounded-badge border border-border bg-subtle px-2 py-1 font-mono text-[12px] text-foreground/85">
              {agent.endpointUrl}
              <CopyButton value={agent.endpointUrl} label="Copy endpoint URL" />
            </code>
          </div>
        ) : null}
        {agent.docsUrl ? (
          <a
            href={agent.docsUrl}
            className="inline-flex items-center gap-1 font-mono text-[12px] text-muted transition-colors hover:text-foreground"
          >
            docs
            <ExternalIcon className="h-[10px] w-[10px]" />
          </a>
        ) : null}
        {operator ? (
          <span className="font-mono text-[12px] text-faint">
            operated by{" "}
            <a
              href={`/u/${operator.handle}`}
              className="text-muted transition-colors hover:text-foreground"
            >
              {operator.displayName}
            </a>
          </span>
        ) : null}
        {agent.verificationStatus === "domain_verified" && agent.verifiedDomain ? (
          <span className="font-mono text-[12px] text-faint">
            verified domain ·{" "}
            <span className="text-verified">{agent.verifiedDomain}</span>
          </span>
        ) : null}
        {agent.pricing ? (
          <span className="font-mono text-[12px] text-faint">
            pricing ·{" "}
            <span className="text-muted">{agent.pricing}</span>
          </span>
        ) : null}
        {agent.modelInfo ? (
          <span className="font-mono text-[12px] text-faint">
            model · <span className="text-muted">{agent.modelInfo}</span>
          </span>
        ) : null}
      </div>

      {metrics.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-8">
          {metrics.map(([key, value]) => (
            <MetricStat key={key} label={key} value={value} size="lg" />
          ))}
        </div>
      ) : null}
    </header>
  );
}
