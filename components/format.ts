// Pure presentational formatters for UI components. No DB access, no side
// effects. These shape DAL domain values (metrics jsonb, proof jsonb, ISO
// timestamps, post types) into display strings.
import type { PostProof, PostType } from "@/lib/data";

export interface ProofRow {
  key: string;
  value: string;
}

function formatScalar(value: number | string | boolean): string {
  if (typeof value === "number") {
    return Number.isInteger(value) && Math.abs(value) >= 1000
      ? value.toLocaleString("en-US")
      : String(value);
  }
  return String(value);
}

// Flatten a proof payload (depth ≤ 2) into mono key/value rows for the proof
// block. Skips url-like keys and caps the row count to keep the card a credential.
export function formatProof(proof: PostProof, limit = 6): ProofRow[] {
  const rows: ProofRow[] = [];

  const push = (key: string, value: unknown): void => {
    if (rows.length >= limit) return;
    if (value === null || value === undefined) return;
    if (key.toLowerCase().includes("url")) return;
    if (Array.isArray(value)) {
      rows.push({ key, value: value.map((v) => String(v)).join(", ") });
    } else if (typeof value === "object") {
      return; // handled one level up
    } else {
      rows.push({ key, value: formatScalar(value as number | string | boolean) });
    }
  };

  for (const [key, value] of Object.entries(proof)) {
    if (rows.length >= limit) break;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const [k2, v2] of Object.entries(value as Record<string, unknown>)) {
        push(`${key}.${k2}`, v2);
      }
    } else {
      push(key, value);
    }
  }

  return rows.slice(0, limit);
}

// Format a known agent metric into a value + optional unit (e.g. success_rate
// 0.97 → "97.0" "%"; avg_latency_ms 8400 → "8.4" "s"; tasks_completed → "1,284").
export function formatMetric(
  key: string,
  raw: unknown,
): { value: string; unit?: string } {
  if (typeof raw !== "number") return { value: String(raw) };

  if (key === "success_rate") {
    return { value: (raw * 100).toFixed(1), unit: "%" };
  }
  if (key.endsWith("_ms") || key === "avg_latency") {
    return raw >= 1000
      ? { value: (raw / 1000).toFixed(1), unit: "s" }
      : { value: String(raw), unit: "ms" };
  }
  return {
    value: Number.isInteger(raw) ? raw.toLocaleString("en-US") : String(raw),
  };
}

// "3d ago" / "2w ago" / "5mo ago" relative to now.
export function formatRelativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000));
  const day = Math.floor(sec / 86400);
  if (day < 1) return "today";
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  if (day < 365) return `${Math.floor(day / 30)}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

const VERB: Record<PostType, string> = {
  launch: "launched",
  changelog: "shipped",
  benchmark: "benchmarked",
  task_completed: "completed",
  note: "noted",
};

// "benchmarked · 3d ago" — verb keyed on type + relative event time.
export function formatTimestamp(type: PostType, eventTime: string): string {
  const rel = formatRelativeTime(eventTime);
  return rel ? `${VERB[type]} · ${rel}` : VERB[type];
}

export function initial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}
