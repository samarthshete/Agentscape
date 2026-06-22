import type { Agent } from "@/lib/data";

const INPUT =
  "h-9 rounded-control border border-border bg-subtle px-3 text-[13px] text-foreground outline-none focus-visible:border-accent";
const LABEL = "text-[13px] font-[540] text-foreground";
const HINT = "font-mono text-[11px] text-faint";

function metricStr(metrics: Agent["metrics"] | undefined, key: string): string {
  const v = metrics?.[key];
  return typeof v === "number" || typeof v === "string" ? String(v) : "";
}

// Presentational create/edit agent fields. `agent` (edit) prefills defaults.
export function AgentFormFields({ agent }: { agent?: Agent }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Name *</span>
          <input
            name="name"
            required
            defaultValue={agent?.name ?? ""}
            placeholder="Atlas Research"
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Slug</span>
          <input
            name="slug"
            defaultValue={agent?.slug ?? ""}
            placeholder="auto from name if blank"
            className={`${INPUT} font-mono`}
          />
          <span className={HINT}>/agents/your-slug · unique</span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Tagline</span>
        <input
          name="tagline"
          defaultValue={agent?.tagline ?? ""}
          placeholder="One line on what it does."
          className={INPUT}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={agent?.description ?? ""}
          placeholder="What it does, how it works, what makes it credible."
          className={`${INPUT} h-auto py-2 leading-[1.6]`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Capabilities</span>
        <input
          name="capabilities"
          defaultValue={agent?.capabilities.join(", ") ?? ""}
          placeholder="literature-review, citation-extraction"
          className={`${INPUT} font-mono`}
        />
        <span className={HINT}>comma-separated · normalized to slugs</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Endpoint URL</span>
          <input
            name="endpoint_url"
            type="url"
            defaultValue={agent?.endpointUrl ?? ""}
            placeholder="https://api.example.com/agent"
            className={`${INPUT} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Docs URL</span>
          <input
            name="docs_url"
            type="url"
            defaultValue={agent?.docsUrl ?? ""}
            placeholder="https://docs.example.com/agent"
            className={`${INPUT} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Pricing</span>
          <input
            name="pricing"
            defaultValue={agent?.pricing ?? ""}
            placeholder="Free · $20/mo · $0.01/task"
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Model info</span>
          <input
            name="model_info"
            defaultValue={agent?.modelInfo ?? ""}
            placeholder="GPT-class + custom retrieval"
            className={INPUT}
          />
        </label>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className={`${LABEL} mb-1`}>Metrics</legend>
        <label className="flex flex-col gap-1.5">
          <span className={HINT}>tasks_completed</span>
          <input
            name="tasks_completed"
            type="number"
            min="0"
            defaultValue={metricStr(agent?.metrics, "tasks_completed")}
            className={`${INPUT} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={HINT}>success_rate (0–1)</span>
          <input
            name="success_rate"
            type="number"
            step="0.001"
            min="0"
            max="1"
            defaultValue={metricStr(agent?.metrics, "success_rate")}
            className={`${INPUT} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={HINT}>avg_latency_ms</span>
          <input
            name="avg_latency_ms"
            type="number"
            min="0"
            defaultValue={metricStr(agent?.metrics, "avg_latency_ms")}
            className={`${INPUT} font-mono`}
          />
        </label>
      </fieldset>
    </div>
  );
}
