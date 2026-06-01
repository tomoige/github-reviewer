import { MetricBlock } from "@/lib/types";
import { scoreStroke } from "@/lib/score";

interface MetricCardProps {
  title: string;
  metric: MetricBlock;
}

export function MetricCard({ title, metric }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <div className="flex items-baseline justify-between">
        <h3 className="type-label">
          {title}
        </h3>
        <span className="font-mono text-2xl font-bold text-primary">
          {metric.score}
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cardAlt">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(0, Math.min(100, metric.score))}%`,
            backgroundColor: scoreStroke(),
          }}
        />
      </div>

      {metric.strengths.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-positive">
            Strengths
          </p>
          <ul className="mt-1 space-y-0.5 text-sm leading-snug text-ink">
            {metric.strengths.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-positive">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {metric.criticalWeaknesses.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-negative">
            Critical Weaknesses
          </p>
          <ul className="mt-1 space-y-0.5 text-sm leading-snug text-ink">
            {metric.criticalWeaknesses.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-negative">!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
