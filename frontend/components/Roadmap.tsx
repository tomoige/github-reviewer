"use client";

import { useMemo, useState } from "react";
import { ReviewReport, RoadmapPriority } from "@/lib/types";

const PRIORITY_ORDER: Record<RoadmapPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function priorityAccent(priority: RoadmapPriority): string {
  switch (priority) {
    case "High":
      return "bg-negative/10 text-negative border-negative/30";
    case "Medium":
      return "bg-primary/10 text-primary border-primary/30";
    default:
      return "bg-positive/10 text-positive border-positive/30";
  }
}

export function Roadmap({
  roadmap,
}: {
  roadmap: ReviewReport["personalizedRoadmap"];
}) {
  const items = useMemo(
    () =>
      [...roadmap.actionItems].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      ),
    [roadmap.actionItems]
  );

  const [done, setDone] = useState<Record<number, boolean>>({});
  const completedCount = Object.values(done).filter(Boolean).length;

  function toggle(index: number) {
    setDone((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold text-ink">Personalized Roadmap</h2>
        <span className="font-mono text-xs text-muted">
          {completedCount}/{items.length} done
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cardAlt">
        <div
          className="h-full rounded-full bg-positive transition-all duration-500"
          style={{
            width: `${items.length ? (completedCount / items.length) * 100 : 0}%`,
          }}
        />
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {items.map((item, i) => {
          const checked = Boolean(done[i]);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex h-full w-full items-start gap-2.5 rounded-lg border border-line bg-cardAlt p-2.5 text-left transition-colors hover:border-primary/40"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs font-bold transition-colors ${
                    checked
                      ? "border-positive bg-positive text-cream"
                      : "border-muted/60 bg-card text-transparent shadow-[inset_0_0_0_1px_rgba(28,20,16,0.06)]"
                  }`}
                  aria-hidden
                >
                  {"\u2713"}
                </span>
                <span className="flex-1">
                  <span
                    className={`text-sm ${
                      checked ? "text-muted line-through" : "text-ink/90"
                    }`}
                  >
                    {item.task}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityAccent(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
                      {item.category}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {roadmap.suggestedReadmeKeywords.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
            Suggested README Keywords
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roadmap.suggestedReadmeKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-full border border-line bg-cardAlt px-3 py-1 font-mono text-xs text-muted"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
