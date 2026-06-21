import type { CSSProperties } from "react";
import type { PostType } from "@/lib/data";

// Per-type tinted badge (launch=blue, changelog=violet, benchmark=amber,
// task_completed=green, note=neutral). Colors come from per-type CSS vars so
// they adapt to dark/light. The label is the literal enum value (mono).
const VAR_KEY: Record<PostType, string> = {
  launch: "launch",
  changelog: "changelog",
  benchmark: "benchmark",
  task_completed: "task",
  note: "note",
};

export function TypeBadge({ type }: { type: PostType }) {
  const k = VAR_KEY[type];
  const style: CSSProperties = {
    color: `var(--badge-${k}-fg)`,
    background: `var(--badge-${k}-bg)`,
    borderColor: `var(--badge-${k}-bd)`,
  };
  return (
    <span
      style={style}
      className="inline-flex flex-none items-center rounded-badge border px-2 py-[3px] font-mono text-[11px] font-medium"
    >
      {type}
    </span>
  );
}
