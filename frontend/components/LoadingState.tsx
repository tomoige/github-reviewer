"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Fetching GitHub data\u2026",
  "Reading your repositories\u2026",
  "Consulting the AI career counselor\u2026",
];

export function LoadingState() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setActive(1), 1400),
      setTimeout(() => setActive(2), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Fill the vertical rail proportionally to the current step.
  const fill = ((active + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto flex max-w-md animate-fade-in gap-4 py-2">
      {/* Vertical progress rail */}
      <div className="relative w-px shrink-0 bg-line">
        <div
          className="absolute left-0 top-0 w-px bg-primary transition-all duration-700 ease-out"
          style={{ height: `${fill}%` }}
        />
      </div>

      <ol className="space-y-3">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li
              key={i}
              className={`text-sm transition-colors duration-300 ${
                current ? "font-semibold text-ink" : done ? "text-muted" : "text-muted/50"
              }`}
            >
              {step}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
