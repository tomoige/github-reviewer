import { z } from "zod";

/**
 * Zod schema mirroring the GitReview AI report contract from spec.md.
 * This is the single source of truth: it both drives the OpenAI structured
 * output (converted to JSON Schema) and validates the model's response.
 */

const metricBlock = z.object({
  score: z.number().int().min(0).max(100),
  strengths: z.array(z.string()),
  criticalWeaknesses: z.array(z.string()),
});

export const reviewReportSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  profileSummary: z.object({
    headline: z.string(),
    estimatedExperienceLevel: z.string(),
  }),
  metrics: z.object({
    documentation: metricBlock,
    codeQuality: metricBlock,
    activityAndVelocity: metricBlock,
    profilePresentation: metricBlock,
  }),
  languageBreakdownAnalysis: z.array(
    z.object({
      language: z.string(),
      competencyRating: z.enum(["Beginner", "Intermediate", "Advanced"]),
    })
  ),
  repositoryEvaluations: z.array(
    z.object({
      repoName: z.string(),
      impactScore: z.number().int().min(0).max(100),
      visualVibe: z.string(),
      specificCritique: z.string(),
      priorityFix: z.string(),
    })
  ),
  personalizedRoadmap: z.object({
    actionItems: z.array(
      z.object({
        task: z.string(),
        priority: z.enum(["High", "Medium", "Low"]),
        category: z.string(),
      })
    ),
    suggestedReadmeKeywords: z.array(z.string()),
  }),
  executiveSummary: z.string(),
  suggestedProfileBio: z
    .string()
    .max(160)
    .describe("Paste-ready GitHub bio, max 160 characters"),
});

/** The portion of the report produced by the LLM. */
export type LlmReviewReport = z.infer<typeof reviewReportSchema>;

/**
 * Deterministic profile completeness, computed in code (not by the LLM) so the
 * checklist is always factually accurate.
 */
export interface ProfileCompleteness {
  score: number;
  checklist: {
    hasAvatar: boolean;
    hasBio: boolean;
    hasWebsite: boolean;
    hasSocialLinks: boolean;
    hasProfileReadme: boolean;
    hasCompany: boolean;
  };
  missingHighImpactItems: string[];
}

export interface ActivitySnapshot {
  reposScanned: number;
  lastPushAt: string | null;
  lastPushLabel: string;
  activeInLast90Days: number;
  dormantCount: number;
  activePercent: number;
  accountCreatedAt: string;
  accountAgeLabel: string;
}

export interface PinRecommendation {
  repoName: string;
  reason: string;
  stars: number;
  language: string | null;
}

export interface LanguageBreakdownEntry {
  language: string;
  repoCount: number;
  competencyRating: "Beginner" | "Intermediate" | "Advanced";
}

export interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

export interface ContributionBreakdown {
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
}

export interface ContributionRepoSource {
  fullName: string;
  ownerLogin: string;
  ownerType: "User" | "Organization";
  isPrivate: boolean;
  contributionCount: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionDay[][];
  /** True when the token owner matches the profile and private activity is included. */
  includesPrivateContributions: boolean;
  restrictedContributionCount?: number;
  /** True when GitHub reports contributions the token cannot access. */
  hasHiddenContributions: boolean;
  breakdown: ContributionBreakdown;
  repositories: ContributionRepoSource[];
}

export interface RepoEvaluation {
  repoName: string;
  impactScore: number;
  visualVibe: string;
  specificCritique: string;
  priorityFix: string;
}

export interface RepositoryDeepDive {
  mostRecent: RepoEvaluation[];
  needsImprovement: RepoEvaluation[];
  best: RepoEvaluation[];
}

/** The full report returned by the API: LLM output + computed fields. */
export type ReviewReport = Omit<
  LlmReviewReport,
  "languageBreakdownAnalysis" | "repositoryEvaluations"
> & {
  languageBreakdownAnalysis: LanguageBreakdownEntry[];
  repositoryDeepDive: RepositoryDeepDive;
  profileCompleteness: ProfileCompleteness;
  activitySnapshot: ActivitySnapshot;
  pinRecommendations: PinRecommendation[];
};
