import { PNG } from "pngjs";
import { AppError } from "../utils/AppError";
import {
  GithubProfile,
  GithubProfilePayload,
  GithubRepoSummary,
  RepoLanguageEntry,
  SocialAccount,
} from "../types/github";

const GITHUB_API = "https://api.github.com";
const MAX_REPOS_FOR_REVIEW = 5;
const MAX_REPOS_FOR_LANGUAGE_SCAN = 100;
const PROFILE_README_MAX_CHARS = 2000;

// Avatar heuristics: GitHub's default identicons are flat geometric PNGs with
// only a handful of colors, while a real uploaded photo has many. We probe a
// small version of the avatar and count distinct (quantized) colors.
const AVATAR_PROBE_SIZE = 80;
const QUANTIZED_COLOR_THRESHOLD = 12;

function buildHeaders(accept = "application/vnd.github+json"): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "GitReview-AI",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Thin wrapper around fetch that maps GitHub's status codes onto AppErrors.
 */
async function githubFetch(path: string, accept?: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      headers: buildHeaders(accept),
    });
  } catch {
    throw new AppError(502, "Unable to reach GitHub. Please try again later.");
  }

  if (response.status === 403 || response.status === 429) {
    throw new AppError(
      429,
      "GitHub API rate limit reached. Add a GITHUB_TOKEN or try again later."
    );
  }

  return response;
}

async function fetchProfile(username: string): Promise<GithubProfile> {
  const response = await githubFetch(`/users/${encodeURIComponent(username)}`);

  if (response.status === 404) {
    throw new AppError(404, `GitHub user "${username}" was not found.`);
  }
  if (!response.ok) {
    throw new AppError(502, "Failed to fetch the GitHub profile.");
  }

  const data = (await response.json()) as Record<string, unknown>;
  const avatarUrl = String(data.avatar_url ?? "");
  const blog = (data.blog as string)?.trim();

  return {
    username: String(data.login ?? username),
    name: (data.name as string) ?? null,
    bio: (data.bio as string) ?? null,
    location: (data.location as string) ?? null,
    company: (data.company as string) ?? null,
    website: blog ? blog : null,
    twitterUsername: (data.twitter_username as string) ?? null,
    hireable: typeof data.hireable === "boolean" ? data.hireable : null,
    avatarUrl,
    // Provisional; refined by detectCustomAvatar() in getProfilePayload, which
    // distinguishes a real uploaded photo from GitHub's default identicon.
    hasAvatar: Boolean(avatarUrl),
    publicRepos: Number(data.public_repos ?? 0),
    publicGists: Number(data.public_gists ?? 0),
    followers: Number(data.followers ?? 0),
    following: Number(data.following ?? 0),
    createdAt: String(data.created_at ?? ""),
    updatedAt: String(data.updated_at ?? ""),
    socialAccounts: [],
    profileReadme: null,
  };
}

/**
 * Determines whether the avatar is a real uploaded photo vs GitHub's default
 * identicon. Non-PNG responses (e.g. a JPEG upload) are treated as custom; PNGs
 * are decoded and judged by how many distinct colors they contain. Any failure
 * falls back to "true" so we never wrongly penalize a user.
 */
async function detectCustomAvatar(avatarUrl: string): Promise<boolean> {
  if (!avatarUrl) return false;
  try {
    const sep = avatarUrl.includes("?") ? "&" : "?";
    const response = await fetch(`${avatarUrl}${sep}s=${AVATAR_PROBE_SIZE}`, {
      headers: { "User-Agent": "GitReview-AI" },
    });
    if (!response.ok) return true;

    const contentType = response.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await response.arrayBuffer());

    // Uploaded photos are commonly served as JPEG/WebP; identicons are PNG.
    if (!contentType.includes("png")) return true;

    const png = PNG.sync.read(buffer);
    const colors = new Set<number>();
    for (let i = 0; i < png.data.length; i += 4) {
      if (png.data[i + 3] === 0) continue; // skip fully transparent
      // Quantize to the top 3 bits per channel to merge anti-aliased shades.
      const r = png.data[i] & 0xe0;
      const g = png.data[i + 1] & 0xe0;
      const b = png.data[i + 2] & 0xe0;
      colors.add((r << 16) | (g << 8) | b);
      if (colors.size > QUANTIZED_COLOR_THRESHOLD) return true;
    }
    return colors.size > QUANTIZED_COLOR_THRESHOLD;
  } catch {
    return true;
  }
}

/**
 * Fetches the user's linked social accounts (LinkedIn, Mastodon, etc.).
 * Returns an empty array on any failure - this is supplementary data.
 */
async function fetchSocialAccounts(username: string): Promise<SocialAccount[]> {
  try {
    const response = await githubFetch(
      `/users/${encodeURIComponent(username)}/social_accounts`
    );
    if (!response.ok) return [];
    const data = (await response.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => ({
        provider: String(item.provider ?? "link"),
        url: String(item.url ?? ""),
      }))
      .filter((a) => a.url);
  } catch {
    return [];
  }
}

/**
 * Fetches the special {username}/{username} profile README (the "About me"
 * shown atop a profile), truncated to keep token usage in check. Returns null
 * when the user has no profile README.
 *
 * Uses the default JSON response and decodes the base64 content rather than the
 * "raw" media type, which 302-redirects to raw.githubusercontent.com.
 */
async function fetchProfileReadme(username: string): Promise<string | null> {
  try {
    const response = await githubFetch(
      `/repos/${encodeURIComponent(username)}/${encodeURIComponent(
        username
      )}/readme`
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      content?: string;
      encoding?: string;
    };
    if (data.encoding !== "base64" || !data.content) return null;

    const text = Buffer.from(data.content, "base64").toString("utf-8").trim();
    if (!text) return null;

    return text.length > PROFILE_README_MAX_CHARS
      ? `${text.slice(0, PROFILE_README_MAX_CHARS)}\n...[truncated]`
      : text;
  } catch {
    return null;
  }
}

/**
 * Checks whether a repo exposes a README via the dedicated readme endpoint.
 * Failures are treated as "no readme" rather than bubbling up.
 */
async function hasReadme(username: string, repoName: string): Promise<boolean> {
  try {
    const response = await githubFetch(
      `/repos/${encodeURIComponent(username)}/${encodeURIComponent(
        repoName
      )}/readme`
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Paginated fetch of all public owner repos (capped). Returns the lightweight
 * language inventory plus the raw first page for top-repo enrichment.
 */
async function fetchPublicRepoData(username: string): Promise<{
  allRepoLanguages: RepoLanguageEntry[];
  firstPageRaw: Array<Record<string, unknown>>;
}> {
  const allRepoLanguages: RepoLanguageEntry[] = [];
  let firstPageRaw: Array<Record<string, unknown>> = [];
  let page = 1;
  const perPage = 100;

  while (allRepoLanguages.length < MAX_REPOS_FOR_LANGUAGE_SCAN) {
    const response = await githubFetch(
      `/users/${encodeURIComponent(
        username
      )}/repos?sort=pushed&direction=desc&per_page=${perPage}&page=${page}&type=owner`
    );

    if (!response.ok) {
      throw new AppError(502, "Failed to fetch the user's repositories.");
    }

    const repos = (await response.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(repos) || repos.length === 0) break;

    if (page === 1) firstPageRaw = repos;

    for (const repo of repos) {
      if (allRepoLanguages.length >= MAX_REPOS_FOR_LANGUAGE_SCAN) break;
      allRepoLanguages.push({
        name: String(repo.name ?? ""),
        language: (repo.language as string) ?? null,
        stars: Number(repo.stargazers_count ?? 0),
        pushedAt: (repo.pushed_at as string) ?? null,
      });
    }

    if (repos.length < perPage) break;
    page += 1;
  }

  return { allRepoLanguages, firstPageRaw };
}

/**
 * Enriches the top N repos with README checks and full summary fields.
 */
async function enrichTopRepositories(
  username: string,
  repoList: Array<Record<string, unknown>>
): Promise<GithubRepoSummary[]> {
  const top = repoList.slice(0, MAX_REPOS_FOR_REVIEW);

  return Promise.all(
    top.map(async (repo) => {
      const name = String(repo.name ?? "");
      return {
        name,
        description: (repo.description as string) ?? null,
        language: (repo.language as string) ?? null,
        stars: Number(repo.stargazers_count ?? 0),
        forks: Number(repo.forks_count ?? 0),
        hasReadme: await hasReadme(username, name),
        updatedAt: String(repo.updated_at ?? ""),
        pushedAt: (repo.pushed_at as string) ?? null,
        topics: Array.isArray(repo.topics) ? (repo.topics as string[]) : [],
      } satisfies GithubRepoSummary;
    })
  );
}

async function fetchRepositories(username: string): Promise<{
  repositories: GithubRepoSummary[];
  allRepoLanguages: RepoLanguageEntry[];
  languageScan: GithubProfilePayload["languageScan"];
}> {
  const { allRepoLanguages, firstPageRaw } = await fetchPublicRepoData(username);
  const repositories = await enrichTopRepositories(username, firstPageRaw);

  return {
    repositories,
    allRepoLanguages,
    languageScan: {
      reposScanned: allRepoLanguages.length,
      totalPublicRepos: 0,
      truncated: false,
    },
  };
}

/**
 * Fetches the public profile and the user's most active repositories.
 * Throws AppError(404) for unknown users and AppError(400) when the user has
 * no public repositories to analyze.
 */
export async function getProfilePayload(
  username: string
): Promise<GithubProfilePayload> {
  // Validate the user exists first, then enrich with supplementary data.
  const profile = await fetchProfile(username);

  const [repoData, socialAccounts, profileReadme, hasCustomAvatar] =
    await Promise.all([
      fetchRepositories(username),
      fetchSocialAccounts(username),
      fetchProfileReadme(username),
      detectCustomAvatar(profile.avatarUrl),
    ]);

  const { repositories, allRepoLanguages, languageScan } = repoData;

  if (repositories.length === 0) {
    throw new AppError(
      400,
      `GitHub user "${username}" has no public repositories to analyze.`
    );
  }

  profile.socialAccounts = socialAccounts;
  profile.profileReadme = profileReadme;
  profile.hasAvatar = hasCustomAvatar;

  return {
    profile,
    repositories,
    allRepoLanguages,
    languageScan: {
      reposScanned: allRepoLanguages.length,
      totalPublicRepos: profile.publicRepos,
      truncated: allRepoLanguages.length < profile.publicRepos,
    },
  };
}
