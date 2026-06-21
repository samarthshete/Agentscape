import { formatMetric } from "./format";

// A single metric: uppercase mono label, big mono tabular value, small mono unit.
export function MetricStat({
  label,
  value,
  size = "md",
}: {
  label: string;
  value: unknown;
  size?: "md" | "lg";
}) {
  const { value: v, unit } = formatMetric(label, value);
  const valueClass = size === "lg" ? "text-[24px]" : "text-[23px]";
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
        {label}
      </div>
      <div
        className={`mt-1 font-mono font-medium tabular-nums text-foreground ${valueClass}`}
      >
        {v}
        {unit ? <span className="text-[14px] text-faint">{unit}</span> : null}
      </div>
    </div>
  );
}
