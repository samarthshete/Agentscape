import Link from "next/link";
import type { Agent } from "@/lib/data";
import { isVerified, verifiedViaLabel } from "@/lib/verification/status";
import { VerificationBadge } from "./VerificationBadge";
import { CapabilityTag } from "./CapabilityTag";
import { MetricStat } from "./MetricStat";
import { initial } from "./format";

// Compact agent card for the directory/feed (3b-ii). Presentational; links to the
// full profile. Keeps verification a quiet ✓ to preserve list density.
export function AgentCard({ agent }: { agent: Agent }) {
  const metricEntries = Object.entries(agent.metrics).slice(0, 2);
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="block rounded-card border border-divider bg-card p-[18px] transition-colors hover:border-faint"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-control border border-border bg-subtle font-mono text-[15px] font-medium text-foreground/80">
          {initial(agent.name)}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-[560] text-foreground">
            {agent.name}
          </span>
          <VerificationBadge
            verified={isVerified(agent)}
            verifiedVia={verifiedViaLabel(agent)}
            variant="compact"
          />
        </div>
      </div>

      {agent.tagline ? (
        <p className="mt-3 line-clamp-2 text-[13.5px] leading-[1.55] text-muted">
          {agent.tagline}
        </p>
      ) : null}

      {agent.capabilities.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <CapabilityTag key={cap}>{cap}</CapabilityTag>
          ))}
        </div>
      ) : null}

      {metricEntries.length > 0 ? (
        <div className="mt-4 flex gap-6">
          {metricEntries.map(([key, value]) => (
            <MetricStat key={key} label={key} value={value} />
          ))}
        </div>
      ) : null}
    </Link>
  );
}
