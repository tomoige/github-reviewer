/**
 * Normalized GitHub data shapes consumed by the AI service.
 * Only the fields relevant to the review are kept.
 */

export interface SocialAccount {
  provider: string;
  url: string;
}

export interface GithubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  website: string | null;
  twitterUsername: string | null;
  hireable: boolean | null;
  avatarUrl: string;
  hasAvatar: boolean;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
  socialAccounts: SocialAccount[];
  profileReadme: string | null;
}

export interface GithubRepoSummary {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  hasReadme: boolean;
  updatedAt: string;
  pushedAt: string | null;
  topics: string[];
}

export interface RepoLanguageEntry {
  name: string;
  language: string | null;
  description: string | null;
  stars: number;
  pushedAt: string | null;
}

export interface GithubProfilePayload {
  profile: GithubProfile;
  /** Repos selected for deep AI critique (recent, standouts, and under-polished). */
  repositories: GithubRepoSummary[];
  /** Every public repo scanned for language inventory (may be capped). */
  allRepoLanguages: RepoLanguageEntry[];
  languageScan: LanguageScanMeta;
}

export interface LanguageScanMeta {
  reposScanned: number;
  totalPublicRepos: number;
  truncated: boolean;
}

/** Lightweight profile data surfaced in the API response (for the dashboard header). */
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
