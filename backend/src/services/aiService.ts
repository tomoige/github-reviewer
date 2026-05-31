import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { LlmReviewReport, reviewReportSchema } from "../schemas/reviewSchema";
import { GithubProfilePayload } from "../types/github";
import { AppError } from "../utils/AppError";

// Provider-agnostic, OpenAI-compatible config. Defaults target Groq's free,
// fast API. Swap LLM_BASE_URL / LLM_MODEL to use Gemini, OpenRouter, etc.
const BASE_URL = process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";

function getApiKey(): string | undefined {
  return (
    process.env.LLM_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

// JSON Schema derived from the single Zod source of truth, embedded in the
// prompt so the model knows the exact shape to produce.
const JSON_SCHEMA = JSON.stringify(
  zodResponseFormat(reviewReportSchema, "review_report").json_schema.schema
);

const SYSTEM_PROMPT = `You are an Elite Technical Recruiter and senior staff engineer who reviews public GitHub profiles for hiring potential.
Analyze the provided GitHub data and produce a structured, honest, and actionable performance report.

Rules:
- Base every judgement strictly on the data provided. Do not invent repositories, languages, or facts.
- Scores are integers from 0-100 and should be calibrated, not inflated.
- "criticalWeaknesses" must be specific and constructive.
- "metrics.profilePresentation" evaluates how well the developer presents themselves: the quality of their bio, profile README ("about me"), website/portfolio link, linked social accounts, company, and avatar. Reward clear self-branding and professional links; penalize an empty or generic profile.
- "executiveSummary" should be a concise, professional 2-4 sentence overview of the developer's profile: who they are, their core strengths, and their overall trajectory. Keep it sharp and recruiter-facing, not a roast.
- "personalizedRoadmap.actionItems" must be a thorough, actionable checklist (typically 5-8 items) of concrete things this specific developer should do to improve. Each item has: a clear "task", a "priority" of exactly "High", "Medium", or "Low", and a short "category" (e.g. Documentation, Visibility, Code Quality, Activity, Profile). Order them roughly by priority, highest first.
- "languageBreakdownAnalysis": include every distinct programming language across the FULL language inventory below (all scanned public repos), not just the 5 most recently pushed deep-reviewed repos. For each entry:
  - "competencyRating" must be exactly "Beginner", "Intermediate", or "Advanced" (never vague labels like "Basic").
  - "ratingRationale" must be 1-2 sentences citing concrete evidence: repo count for that language across the full inventory, named repos (up to 3 examples), and—where applicable—signals from the 5 most recently pushed deep-reviewed repos (README, description, topics, stars, recency). This field must clearly explain WHY that rating was chosen.
  - "context" describes how/where they use the language in their portfolio (patterns, domains, standout projects)—not a repeat of the rationale.
- Cover every repository provided in mostRecentRepositoriesEvaluated and every distinct language in languageBreakdownAnalysis.

Respond with ONLY a single valid JSON object. No markdown fences, no commentary.
The JSON object MUST conform exactly to this JSON Schema:
${JSON_SCHEMA}`;

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AppError(
      500,
      "Server is missing the LLM API key. Set LLM_API_KEY (or GROQ_API_KEY)."
    );
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey, baseURL: BASE_URL });
  }
  return cachedClient;
}

function buildLanguageSummary(payload: GithubProfilePayload): string {
  const { allRepoLanguages, languageScan } = payload;
  const byLanguage = new Map<string, string[]>();

  for (const repo of allRepoLanguages) {
    if (!repo.language) continue;
    const repos = byLanguage.get(repo.language) ?? [];
    repos.push(repo.name);
    byLanguage.set(repo.language, repos);
  }

  if (byLanguage.size === 0) return "(no language data in scanned repos)";

  const header = languageScan.truncated
    ? `Scanned ${languageScan.reposScanned} of ${languageScan.totalPublicRepos} public repos (most recently pushed):`
    : `Scanned all ${languageScan.reposScanned} public repos:`;

  const lines = [...byLanguage.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([language, repos]) => {
      const shown = repos.slice(0, 8);
      const extra =
        repos.length > shown.length ? ` (+${repos.length - shown.length} more)` : "";
      return `- ${language}: ${repos.length} repo(s) — ${shown.join(", ")}${extra}`;
    });

  return [header, ...lines].join("\n");
}

/**
 * Flattens the GitHub payload into a single string prompt for the model.
 */
function buildUserPrompt(payload: GithubProfilePayload): string {
  const { profile, repositories } = payload;

  const repoLines = repositories
    .map((repo, index) => {
      return [
        `${index + 1}. ${repo.name}`,
        `   - Language: ${repo.language ?? "Unknown"}`,
        `   - Description: ${repo.description ?? "(none)"}`,
        `   - Has README: ${repo.hasReadme ? "Yes" : "No"}`,
        `   - Stars: ${repo.stars} | Forks: ${repo.forks}`,
        `   - Topics: ${repo.topics.length ? repo.topics.join(", ") : "(none)"}`,
        `   - Last pushed: ${repo.pushedAt ?? "Unknown"}`,
      ].join("\n");
    })
    .join("\n");

  const socials = profile.socialAccounts.length
    ? profile.socialAccounts.map((s) => `${s.provider}: ${s.url}`).join(", ")
    : "(none)";

  return [
    "Analyze this GitHub profile and return the review as JSON.",
    "",
    "GITHUB PROFILE",
    `Username: ${profile.username}`,
    `Name: ${profile.name ?? "(not set)"}`,
    `Bio: ${profile.bio ?? "(not set)"}`,
    `Location: ${profile.location ?? "(not set)"}`,
    `Company: ${profile.company ?? "(not set)"}`,
    `Website: ${profile.website ?? "(not set)"}`,
    `Twitter/X: ${profile.twitterUsername ?? "(not set)"}`,
    `Open to work (hireable): ${profile.hireable === null ? "(unknown)" : profile.hireable ? "Yes" : "No"}`,
    `Linked social accounts: ${socials}`,
    `Has custom-uploaded avatar: ${profile.hasAvatar ? "Yes" : "No"}`,
    `Public repos: ${profile.publicRepos} | Public gists: ${profile.publicGists}`,
    `Followers: ${profile.followers} | Following: ${profile.following}`,
    `Account created: ${profile.createdAt} | Last active: ${profile.updatedAt}`,
    "",
    "PROFILE README (their self-written 'About me'):",
    profile.profileReadme ?? "(no profile README found)",
    "",
    `TOP ${repositories.length} MOST RECENTLY ACTIVE REPOSITORIES (deep review)`,
    repoLines,
    "",
    "FULL LANGUAGE INVENTORY (use for languageBreakdownAnalysis — covers all scanned public repos, not just the 5 most recent above):",
    buildLanguageSummary(payload),
  ].join("\n");
}

/**
 * Strips accidental markdown code fences some models wrap JSON in.
 */
function extractJson(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

/**
 * Sends the GitHub payload to the configured model and returns the validated
 * report. Uses JSON mode plus Zod validation for broad provider compatibility.
 */
export async function generateReview(
  payload: GithubProfilePayload
): Promise<LlmReviewReport> {
  const client = getClient();

  let content: string | null | undefined;
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(payload) },
      ],
    });
    content = completion.choices[0]?.message.content;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown LLM error";
    throw new AppError(502, `AI analysis failed: ${message}`);
  }

  if (!content) {
    throw new AppError(502, "The AI model returned an empty response.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJson(content));
  } catch {
    throw new AppError(502, "The AI model did not return valid JSON.");
  }

  const result = reviewReportSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new AppError(
      502,
      "The AI model's response did not match the expected report format."
    );
  }

  return result.data;
}
