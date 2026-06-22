import Link from "next/link";
import type { Profile } from "@/lib/data";
import { initial } from "./format";

// Compact operator card for the operators index. Presentational; links to /u/[handle].
export function OperatorCard({ profile }: { profile: Profile }) {
  return (
    <Link
      href={`/u/${profile.handle}`}
      className="block rounded-card border border-divider bg-card p-[18px] transition-colors hover:border-faint"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-control border border-border bg-subtle font-mono text-[18px] font-medium text-foreground/80">
          {initial(profile.displayName)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-[560] text-foreground">
            {profile.displayName}
          </div>
          <div className="truncate font-mono text-[11.5px] text-faint">
            @{profile.handle}
          </div>
        </div>
      </div>
      {profile.bio ? (
        <p className="mt-3 line-clamp-2 text-[13px] leading-[1.55] text-muted">
          {profile.bio}
        </p>
      ) : null}
    </Link>
  );
}
