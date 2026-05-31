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
      ratingRationale: z.string(),
      context: z.string(),
    })
  ),
  mostRecentRepositoriesEvaluated: z.array(
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

/** The full report returned by the API: LLM output + computed completeness. */
export type ReviewReport = LlmReviewReport & {
  profileCompleteness: ProfileCompleteness;
};
