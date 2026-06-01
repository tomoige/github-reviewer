import { RepoLanguageEntry } from "../types/github";

export const REPOS_PER_TAB = 5;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function needsImprovementScore(repo: RepoLanguageEntry): number {
  let score = 0;
  if (!repo.description?.trim()) score += 40;
  if (repo.stars === 0) score += 15;
  const days = daysSince(repo.pushedAt);
  if (days !== null && days > 180) score += 25;
  if (days !== null && days > 365) score += 15;
  return score;
}

function bestRepoScore(repo: RepoLanguageEntry): number {
  let score = repo.stars * 4;
  if (repo.description?.trim()) score += 18;
  const days = daysSince(repo.pushedAt);
  if (days !== null && days <= 90) score += 25;
  else if (days !== null && days <= 365) score += 10;
  return score;
}

/**
 * Picks a diverse set of repo names for LLM deep review: recent activity,
 * likely portfolio standouts, and repos that look under-polished.
 */
export function selectRepoNamesForEvaluation(
  inventory: RepoLanguageEntry[]
): string[] {
  if (inventory.length === 0) return [];

  const recent = inventory.slice(0, REPOS_PER_TAB).map((repo) => repo.name);

  const needs = [...inventory]
    .sort((a, b) => needsImprovementScore(b) - needsImprovementScore(a))
    .slice(0, REPOS_PER_TAB)
    .map((repo) => repo.name);

  const best = [...inventory]
    .sort((a, b) => bestRepoScore(b) - bestRepoScore(a))
    .slice(0, REPOS_PER_TAB)
    .map((repo) => repo.name);

  return [...new Set([...recent, ...needs, ...best])];
}
