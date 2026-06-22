// Pure presentational formatters for UI components. No DB access, no side
// effects. These shape DAL domain values (metrics jsonb, proof jsonb, ISO
// timestamps, post types) into display strings.
import type { PostProof, PostType } from "@/lib/data";

// A headline evidence figure (the numbers that lead). `note` carries the parent
// group name for nested values (e.g. "baseline", "before") so labels stay clean.
export interface ProofMetric {
  label: string;
  value: string;
  note?: string;
}

// Secondary descriptive context (dataset, version, refs) — shown de-emphasized.
export interface ProofContext {
  label: string;
  value: string;
  href?: string;
}

export interface ProofDisplay {
  metrics: ProofMetric[];
  context: ProofContext[];
}

function formatNumber(value: number): string {
  return Number.isInteger(value) && Math.abs(value) >= 1000
    ? value.toLocaleString("en-US")
    : String(value);
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

// Shape an arbitrary proof payload into a designed credential, not a JSON dump.
// Generic over any agent's keys:
//   - numeric leaves → the headline evidence grid; labels are de-pathed (last
//     segment), and nested groups (baseline / before / after) carry the group
//     name as a small note instead of a dotted key,
//   - a `metrics:{…}` container leads,
//   - strings / urls / arrays → a secondary, de-emphasized context row.
export function formatProof(proof: PostProof): ProofDisplay {
  const metrics: ProofMetric[] = [];
  const context: ProofContext[] = [];

  const add = (label: string, value: unknown, note?: string): void => {
    if (value === null || value === undefined) return;
    if (typeof value === "number") {
      metrics.push({ label, value: formatNumber(value), note });
    } else if (typeof value === "boolean") {
      context.push({ label, value: value ? "yes" : "no" });
    } else if (typeof value === "string") {
      context.push(
        isUrl(value) ? { label, value, href: value } : { label, value },
      );
    }
  };

  // Headline metrics from a `metrics` container lead the grid.
  const metricsObj = proof["metrics"];
  if (
    metricsObj !== null &&
    typeof metricsObj === "object" &&
    !Array.isArray(metricsObj)
  ) {
    for (const [k, v] of Object.entries(metricsObj)) add(k, v);
  }

  for (const [key, value] of Object.entries(proof)) {
    if (key === "metrics") continue;
    if (Array.isArray(value)) {
      context.push({ label: key, value: value.map((v) => String(v)).join(", ") });
    } else if (value !== null && typeof value === "object") {
      // Nested group (baseline / before / after, …). Numeric children de-path to
      // the child key with the group as a note; string/bool children carry the
      // GROUP name as their label (so baseline.name → "baseline: GPT-class RAG…",
      // never an orphaned "name" or a dotted "baseline.name").
      for (const [childKey, childVal] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (typeof childVal === "number") {
          metrics.push({ label: childKey, value: formatNumber(childVal), note: key });
        } else if (typeof childVal === "string") {
          context.push(
            isUrl(childVal)
              ? { label: key, value: childVal, href: childVal }
              : { label: key, value: childVal },
          );
        } else if (typeof childVal === "boolean") {
          context.push({ label: key, value: childVal ? "yes" : "no" });
        }
      }
    } else {
      add(key, value);
    }
  }

  return { metrics, context };
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
