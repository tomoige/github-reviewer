type Competency = "Beginner" | "Intermediate" | "Advanced";
type Priority = "High" | "Medium" | "Low";

function clampInt(value: unknown, fallback = 50): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeCompetency(value: unknown): Competency {
  if (typeof value !== "string") return "Intermediate";
  const lower = value.toLowerCase();
  if (lower.startsWith("beg")) return "Beginner";
  if (lower.startsWith("adv")) return "Advanced";
  return "Intermediate";
}

function normalizePriority(value: unknown): Priority {
  if (typeof value !== "string") return "Medium";
  const lower = value.toLowerCase();
  if (lower.startsWith("h")) return "High";
  if (lower.startsWith("l")) return "Low";
  return "Medium";
}

function normalizeMetricBlock(value: unknown): {
  score: number;
  strengths: string[];
  criticalWeaknesses: string[];
} {
  const block =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    score: clampInt(block.score),
    strengths: asStringArray(block.strengths),
    criticalWeaknesses: asStringArray(
      block.criticalWeaknesses ?? block.weaknesses
    ),
  };
}

function normalizeMetrics(value: unknown): Record<string, unknown> {
  const metrics =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const empty = { score: 50, strengths: [], criticalWeaknesses: [] };

  return {
    documentation: normalizeMetricBlock(metrics.documentation ?? empty),
    codeQuality: normalizeMetricBlock(metrics.codeQuality ?? empty),
    activityAndVelocity: normalizeMetricBlock(
      metrics.activityAndVelocity ??
        metrics.projectManagement ??
        metrics.activity ??
        empty
    ),
    profilePresentation: normalizeMetricBlock(
      metrics.profilePresentation ??
        metrics.collaboration ??
        metrics.presentation ??
        empty
    ),
  };
}

function normalizeLanguageBreakdown(value: unknown): Array<{
  language: string;
  competencyRating: Competency;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === "object"
    )
    .map((entry) => ({
      language: String(entry.language ?? "Unknown"),
      competencyRating: normalizeCompetency(entry.competencyRating),
    }))
    .filter((entry) => entry.language !== "Unknown");
}

function normalizeRepositoryEvaluations(value: unknown): Array<{
  repoName: string;
  impactScore: number;
  visualVibe: string;
  specificCritique: string;
  priorityFix: string;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === "object"
    )
    .map((entry) => ({
      repoName: String(entry.repoName ?? entry.name ?? ""),
      impactScore: clampInt(entry.impactScore, 50),
      visualVibe: String(entry.visualVibe ?? entry.vibe ?? "No summary provided."),
      specificCritique: String(
        entry.specificCritique ?? entry.critique ?? "No critique provided."
      ),
      priorityFix: String(
        entry.priorityFix ?? entry.fix ?? "Add a README and repository description."
      ),
    }))
    .filter((entry) => entry.repoName.length > 0);
}

function scaffoldRepositoryEvaluations(
  evaluations: Array<{
    repoName: string;
    impactScore: number;
    visualVibe: string;
    specificCritique: string;
    priorityFix: string;
  }>,
  repoNames: string[]
): typeof evaluations {
  const byName = new Map(
    evaluations.map((entry) => [entry.repoName.toLowerCase(), entry])
  );

  for (const name of repoNames) {
    if (!byName.has(name.toLowerCase())) {
      evaluations.push({
        repoName: name,
        impactScore: 50,
        visualVibe: "Insufficient detail returned for this repository.",
        specificCritique:
          "This repository was not fully evaluated in the model response.",
        priorityFix: "Add a clear README and repository description.",
      });
    }
  }

  return evaluations;
}

/**
 * Coerces common Llama 8B formatting mistakes into the expected report shape
 * before Zod validation.
 */
export function normalizeLlmReviewPayload(
  raw: unknown,
  repoNames: string[]
): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const obj = { ...(raw as Record<string, unknown>) };

  if (!obj.repositoryEvaluations && obj.mostRecentRepositoriesEvaluated) {
    obj.repositoryEvaluations = obj.mostRecentRepositoriesEvaluated;
  }

  obj.overallScore = clampInt(obj.overallScore, 50);

  const profileSummary =
    obj.profileSummary && typeof obj.profileSummary === "object"
      ? (obj.profileSummary as Record<string, unknown>)
      : {};

  obj.profileSummary = {
    headline: String(
      profileSummary.headline ?? profileSummary.title ?? "GitHub developer"
    ),
    estimatedExperienceLevel: String(
      profileSummary.estimatedExperienceLevel ??
        profileSummary.experienceLevel ??
        "Intermediate"
    ),
  };

  obj.metrics = normalizeMetrics(obj.metrics);
  obj.languageBreakdownAnalysis = normalizeLanguageBreakdown(
    obj.languageBreakdownAnalysis
  );

  obj.repositoryEvaluations = scaffoldRepositoryEvaluations(
    normalizeRepositoryEvaluations(obj.repositoryEvaluations),
    repoNames
  );

  const roadmap =
    obj.personalizedRoadmap && typeof obj.personalizedRoadmap === "object"
      ? (obj.personalizedRoadmap as Record<string, unknown>)
      : {};

  const actionItems = Array.isArray(roadmap.actionItems)
    ? roadmap.actionItems
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object"
        )
        .map((item) => ({
          task: String(item.task ?? item.action ?? "Improve your GitHub profile."),
          priority: normalizePriority(item.priority),
          category: String(item.category ?? "Profile"),
        }))
    : [];

  obj.personalizedRoadmap = {
    actionItems,
    suggestedReadmeKeywords: asStringArray(roadmap.suggestedReadmeKeywords),
  };

  obj.executiveSummary = String(
    obj.executiveSummary ?? obj.summary ?? "Profile analysis unavailable."
  );

  const bio = String(obj.suggestedProfileBio ?? obj.bio ?? "");
  obj.suggestedProfileBio = bio.length > 160 ? bio.slice(0, 160) : bio;

  return obj;
}
