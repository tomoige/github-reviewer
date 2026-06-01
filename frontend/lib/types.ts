// Mirrors the backend ReviewReport contract (backend/src/schemas/reviewSchema.ts).

export interface MetricBlock {
  score: number;
  strengths: string[];
  criticalWeaknesses: string[];
}

export interface LanguageBreakdown {
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
  includesPrivateContributions: boolean;
  restrictedContributionCount?: number;
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

export interface PinRecommendation {
  repoName: string;
  reason: string;
  stars: number;
  language: string | null;
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

export interface RepositoryDeepDive {
  mostRecent: RepoEvaluation[];
  needsImprovement: RepoEvaluation[];
  best: RepoEvaluation[];
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
  repositoryDeepDive: RepositoryDeepDive;
  personalizedRoadmap: {
    actionItems: RoadmapItem[];
    suggestedReadmeKeywords: string[];
  };
  executiveSummary: string;
  suggestedProfileBio: string;
  profileCompleteness: ProfileCompleteness;
  activitySnapshot: ActivitySnapshot;
  pinRecommendations: PinRecommendation[];
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
  contributionCalendar: ContributionCalendar | null;
}
