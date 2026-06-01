import { PinRecommendation } from "../schemas/reviewSchema";
import { GithubRepoSummary, RepoLanguageEntry } from "../types/github";

const MAX_PINS = 6;
const RECENT_DAYS = 90;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function scoreRepo(
  repo: RepoLanguageEntry,
  readmeKnown: Map<string, boolean>
): number {
  let score = repo.stars * 4;

  if (repo.description?.trim()) score += 18;

  if (readmeKnown.get(repo.name)) score += 22;

  const days = daysSince(repo.pushedAt);
  if (days !== null) {
    if (days <= 30) score += 28;
    else if (days <= RECENT_DAYS) score += 18;
    else if (days <= 365) score += 6;
  }

  return score;
}

function buildReason(
  repo: RepoLanguageEntry,
  readmeKnown: Map<string, boolean>
): string {
  const parts: string[] = [];

  if (repo.stars > 0) {
    parts.push(
      repo.stars === 1 ? "1 star" : `${repo.stars} stars — social proof`
    );
  }

  if (readmeKnown.get(repo.name)) {
    parts.push("has a README");
  } else if (repo.description?.trim()) {
    parts.push("has a description");
  }

  const days = daysSince(repo.pushedAt);
  if (days !== null && days <= RECENT_DAYS) {
    parts.push("recently updated");
  } else if (repo.stars >= 5) {
    parts.push("strong portfolio piece");
  } else if (repo.language) {
    parts.push(`showcases ${repo.language}`);
  }

  if (parts.length === 0) {
    return "Representative public project worth surfacing on your profile";
  }

  const sentence = parts.join("; ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

export function computePinRecommendations(
  inventory: RepoLanguageEntry[],
  deepReviewed: GithubRepoSummary[]
): PinRecommendation[] {
  const readmeKnown = new Map<string, boolean>();
  for (const repo of deepReviewed) {
    readmeKnown.set(repo.name, repo.hasReadme);
  }

  const ranked = [...inventory]
    .map((repo) => ({
      repo,
      score: scoreRepo(repo, readmeKnown),
    }))
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const picks: PinRecommendation[] = [];

  for (const { repo } of ranked) {
    if (picks.length >= MAX_PINS) break;
    if (seen.has(repo.name)) continue;
    seen.add(repo.name);

    picks.push({
      repoName: repo.name,
      reason: buildReason(repo, readmeKnown),
      stars: repo.stars,
      language: repo.language,
    });
  }

  return picks;
}
