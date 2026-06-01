import { RepoEvaluation, RepositoryDeepDive } from "../schemas/reviewSchema";
import { RepoLanguageEntry } from "../types/github";
import { REPOS_PER_TAB } from "./repoSelectionService";

export function buildRepositoryDeepDive(
  evaluations: RepoEvaluation[],
  inventory: RepoLanguageEntry[]
): RepositoryDeepDive {
  const byName = new Map(
    evaluations.map((entry) => [entry.repoName.toLowerCase(), entry])
  );

  function pickByNames(names: string[]): RepoEvaluation[] {
    return names
      .map((name) => byName.get(name.toLowerCase()))
      .filter((entry): entry is RepoEvaluation => entry !== undefined);
  }

  const recentNames = inventory.slice(0, REPOS_PER_TAB).map((repo) => repo.name);

  const byImpactAsc = [...evaluations].sort(
    (a, b) => a.impactScore - b.impactScore
  );
  const byImpactDesc = [...evaluations].sort(
    (a, b) => b.impactScore - a.impactScore
  );

  return {
    mostRecent: pickByNames(recentNames).slice(0, REPOS_PER_TAB),
    needsImprovement: byImpactAsc.slice(0, REPOS_PER_TAB),
    best: byImpactDesc.slice(0, REPOS_PER_TAB),
  };
}
