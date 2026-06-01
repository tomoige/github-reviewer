"use client";

import { useMemo, useState } from "react";
import { RepositoryDeepDive as RepositoryDeepDiveType } from "@/lib/types";
import { RepoCard } from "./RepoCard";

type TabId = keyof RepositoryDeepDiveType;

const TABS: Array<{ id: TabId; label: string; description: string }> = [
  {
    id: "mostRecent",
    label: "Most recent",
    description: "Your latest pushed public repos.",
  },
  {
    id: "needsImprovement",
    label: "Needs improvement",
    description: "Lowest impact scores — fix these first.",
  },
  {
    id: "best",
    label: "Best repos",
    description: "Strongest portfolio pieces to pin or highlight.",
  },
];

function hasAnyRepos(deepDive: RepositoryDeepDiveType): boolean {
  return (
    deepDive.mostRecent.length > 0 ||
    deepDive.needsImprovement.length > 0 ||
    deepDive.best.length > 0
  );
}

export function RepoDeepDive({
  deepDive,
}: {
  deepDive: RepositoryDeepDiveType;
}) {
  const firstNonEmptyTab = useMemo(() => {
    for (const tab of TABS) {
      if (deepDive[tab.id].length > 0) return tab.id;
    }
    return "mostRecent" as TabId;
  }, [deepDive]);

  const [activeTab, setActiveTab] = useState<TabId>(firstNonEmptyTab);

  if (!hasAnyRepos(deepDive)) return null;

  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const repos = deepDive[activeTab];

  return (
    <div className="space-y-3">
      <div
        className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-cardAlt p-1"
        role="tablist"
        aria-label="Repository deep dive views"
      >
        {TABS.map((tab) => {
          const count = deepDive[tab.id].length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={count === 0}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-card text-ink shadow-sm"
                  : count === 0
                    ? "cursor-not-allowed text-muted opacity-40"
                    : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 font-mono text-xs tabular-nums opacity-70">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted">{active.description}</p>

      {repos.length === 0 ? (
        <p className="text-sm text-muted">No repositories in this view.</p>
      ) : (
        <div
          className="overflow-hidden rounded-lg border border-line bg-card"
          role="tabpanel"
          aria-label={active.label}
        >
          <div className="divide-y divide-line">
            {repos.map((repo) => (
              <RepoCard key={repo.repoName} repo={repo} variant="list" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
