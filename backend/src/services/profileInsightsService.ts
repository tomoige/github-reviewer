import {
  ContributionCalendar,
  LanguageBreakdownEntry,
  LlmReviewReport,
} from "../schemas/reviewSchema";
import { RepoLanguageEntry } from "../types/github";

const CONTRIBUTION_COLLECTION_FIELDS = `
  hasAnyRestrictedContributions
  restrictedContributionsCount
  totalCommitContributions
  totalPullRequestContributions
  totalPullRequestReviewContributions
  totalIssueContributions
  totalRepositoriesWithContributedCommits
  contributionCalendar {
    totalContributions
    weeks {
      contributionDays {
        date
        contributionCount
        contributionLevel
      }
    }
  }
  commitContributionsByRepository(maxRepositories: 100) {
    repository {
      name
      isPrivate
      owner {
        login
        ... on Organization {
          __typename
        }
        ... on User {
          __typename
        }
      }
    }
    contributions {
      totalCount
    }
  }
`;

const USER_CONTRIBUTION_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        ${CONTRIBUTION_COLLECTION_FIELDS}
      }
    }
  }
`;

const VIEWER_CONTRIBUTION_QUERY = `
  query {
    viewer {
      contributionsCollection {
        ${CONTRIBUTION_COLLECTION_FIELDS}
      }
    }
  }
`;

const LEVEL_MAP: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface GraphqlContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: string | number;
}

interface GraphqlCalendar {
  totalContributions: number;
  weeks: Array<{
    contributionDays: GraphqlContributionDay[];
  }>;
}

interface GraphqlRepoContribution {
  repository: {
    name: string;
    isPrivate: boolean;
    owner: {
      login: string;
      __typename?: string;
    };
  };
  contributions: {
    totalCount: number;
  };
}

interface GraphqlContributionsCollection {
  hasAnyRestrictedContributions?: boolean;
  restrictedContributionsCount?: number;
  totalCommitContributions?: number;
  totalPullRequestContributions?: number;
  totalPullRequestReviewContributions?: number;
  totalIssueContributions?: number;
  totalRepositoriesWithContributedCommits?: number;
  contributionCalendar?: GraphqlCalendar;
  commitContributionsByRepository?: GraphqlRepoContribution[];
}

function countToLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function parseContributionLevel(day: GraphqlContributionDay): number {
  const raw = day.contributionLevel;
  if (typeof raw === "number" && raw >= 0 && raw <= 4) return raw;
  if (typeof raw === "string") {
    const mapped = LEVEL_MAP[raw.toUpperCase()];
    if (mapped !== undefined) return mapped;
  }
  return countToLevel(day.contributionCount);
}

function mapCollection(
  collection: GraphqlContributionsCollection,
  includesPrivateContributions: boolean
): ContributionCalendar | null {
  const calendar = collection.contributionCalendar;
  if (!calendar) return null;

  const repositories = (collection.commitContributionsByRepository ?? [])
    .map((entry) => ({
      fullName: `${entry.repository.owner.login}/${entry.repository.name}`,
      ownerLogin: entry.repository.owner.login,
      ownerType:
        entry.repository.owner.__typename === "Organization"
          ? ("Organization" as const)
          : ("User" as const),
      isPrivate: entry.repository.isPrivate,
      contributionCount: entry.contributions.totalCount,
    }))
    .sort((a, b) => b.contributionCount - a.contributionCount);

  const restrictedCount = collection.restrictedContributionsCount ?? 0;
  const hasHiddenContributions =
    Boolean(collection.hasAnyRestrictedContributions) || restrictedCount > 0;

  return {
    totalContributions: calendar.totalContributions,
    includesPrivateContributions,
    restrictedContributionCount: restrictedCount,
    hasHiddenContributions,
    breakdown: {
      commits: collection.totalCommitContributions ?? 0,
      pullRequests: collection.totalPullRequestContributions ?? 0,
      reviews: collection.totalPullRequestReviewContributions ?? 0,
      issues: collection.totalIssueContributions ?? 0,
    },
    repositories,
    weeks: calendar.weeks.map((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: parseContributionLevel(day),
      }))
    ),
  };
}

let cachedTokenLogin: string | null | undefined;

async function fetchAuthenticatedLogin(token: string): Promise<string | null> {
  if (cachedTokenLogin !== undefined) return cachedTokenLogin;

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "GitReview-AI",
      },
    });

    if (!response.ok) {
      cachedTokenLogin = null;
      return null;
    }

    const data = (await response.json()) as { login?: string };
    cachedTokenLogin = data.login?.toLowerCase() ?? null;
    return cachedTokenLogin;
  } catch {
    cachedTokenLogin = null;
    return null;
  }
}

async function graphqlRequest<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: T; errors?: Array<{ message: string }> } | null> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "GitReview-AI",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    console.warn(
      "GitHub GraphQL contribution calendar errors:",
      json.errors.map((e) => e.message).join("; ")
    );
  }

  return json;
}

/**
 * Fetches the last ~year contribution calendar via GitHub GraphQL.
 * Requires GITHUB_TOKEN — returns null when unavailable or on failure.
 *
 * When the token owner matches the requested username, uses the viewer query
 * so private contributions are included (same as viewing your own profile).
 * For other users, only public contributions are available via the API.
 *
 * Note: totals only include repositories the token can access. Fine-grained
 * tokens scoped to specific repos will under-count vs the GitHub profile.
 */
export async function fetchContributionCalendar(
  username: string
): Promise<ContributionCalendar | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const tokenLogin = await fetchAuthenticatedLogin(token);
    const isSelf =
      tokenLogin !== null && tokenLogin === username.toLowerCase();

    if (isSelf) {
      const json = await graphqlRequest<{
        viewer?: {
          contributionsCollection?: GraphqlContributionsCollection;
        };
      }>(token, VIEWER_CONTRIBUTION_QUERY);

      const collection = json?.data?.viewer?.contributionsCollection;
      if (!collection) return null;

      return mapCollection(collection, true);
    }

    const json = await graphqlRequest<{
      user?: {
        contributionsCollection?: GraphqlContributionsCollection;
      };
    }>(token, USER_CONTRIBUTION_QUERY, { login: username });

    const collection = json?.data?.user?.contributionsCollection;
    if (!collection) return null;

    return mapCollection(collection, false);
  } catch (error) {
    console.warn("Failed to fetch contribution calendar:", error);
    return null;
  }
}

export function mergeLanguageBreakdown(
  llmReport: LlmReviewReport,
  inventory: RepoLanguageEntry[]
): LanguageBreakdownEntry[] {
  const repoCounts = new Map<string, number>();

  for (const repo of inventory) {
    if (!repo.language) continue;
    repoCounts.set(repo.language, (repoCounts.get(repo.language) ?? 0) + 1);
  }

  const ratingByLanguage = new Map(
    llmReport.languageBreakdownAnalysis.map((entry) => [
      entry.language,
      entry.competencyRating,
    ])
  );

  return [...repoCounts.entries()]
    .map(([language, repoCount]) => ({
      language,
      repoCount,
      competencyRating:
        ratingByLanguage.get(language) ??
        ("Intermediate" as LanguageBreakdownEntry["competencyRating"]),
    }))
    .sort((a, b) => b.repoCount - a.repoCount);
}
