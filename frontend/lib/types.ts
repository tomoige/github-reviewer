// Mirrors the backend ReviewReport contract (backend/src/schemas/reviewSchema.ts).

export interface MetricBlock {
  score: number;
  strengths: string[];
  criticalWeaknesses: string[];
}

export interface LanguageBreakdown {
  language: string;
  competencyRating: "Beginner" | "Intermediate" | "Advanced";
  ratingRationale: string;
  context: string;
}

export interface RepoEvaluation {
  repoName: string;
  impactScore: number;
  visualVibe: string;
  specificCritique: string;
  priorityFix: string;
}

export type RoadmapPriority = "High" | "Medium" | "Low";

export interface RoadmapItem {
  task: string;
  priority: RoadmapPriority;
  category: string;
}

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

export interface ReviewReport {
  overallScore: number;
  profileSummary: {
    headline: string;
    estimatedExperienceLevel: string;
  };
  metrics: {
    documentation: MetricBlock;
    codeQuality: MetricBlock;
    activityAndVelocity: MetricBlock;
    profilePresentation: MetricBlock;
  };
  languageBreakdownAnalysis: LanguageBreakdown[];
  mostRecentRepositoriesEvaluated: RepoEvaluation[];
  personalizedRoadmap: {
    actionItems: RoadmapItem[];
    suggestedReadmeKeywords: string[];
  };
  executiveSummary: string;
  profileCompleteness: ProfileCompleteness;
}

export interface ProfileBasics {
  username: string;
  name: string | null;
  avatarUrl: string;
  company: string | null;
  website: string | null;
  followers: number;
  following: number;
  publicRepos: number;
}

export interface LanguageScanMeta {
  reposScanned: number;
  totalPublicRepos: number;
  truncated: boolean;
}

export interface ReviewResponse {
  username: string;
  cached: boolean;
  profile: ProfileBasics;
  report: ReviewReport;
  languageScan: LanguageScanMeta;
}
