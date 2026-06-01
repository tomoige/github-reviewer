import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ZodError } from "zod";
import { LlmReviewReport, reviewReportSchema } from "../schemas/reviewSchema";
import { GithubProfilePayload } from "../types/github";
import { normalizeLlmReviewPayload } from "./llmResponseNormalizer";
import { AppError } from "../utils/AppError";

// Provider-agnostic, OpenAI-compatible config. Defaults target Groq's free,
// fast API. Swap LLM_BASE_URL / LLM_MODEL to use Gemini, OpenRouter, etc.
const BASE_URL = process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.LLM_MODEL ?? "llama-3.1-8b-instant";

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
- "languageBreakdownAnalysis": include every distinct programming language from the FULL LANGUAGE INVENTORY below. For each entry provide only "language" and "competencyRating" (exactly "Beginner", "Intermediate", or "Advanced"). Repo counts are added automatically — do not include rationale or prose.
- "metrics": each metric object must use "strengths" and "criticalWeaknesses" (not "weaknesses"). Required keys: documentation, codeQuality, activityAndVelocity, profilePresentation.
- "repositoryEvaluations": include one entry for every repository listed in the deep review section. Each entry needs repoName, impactScore (0-100 portfolio impact), visualVibe, specificCritique, and priorityFix.
- Cover every distinct language in languageBreakdownAnalysis when possible.
- "suggestedProfileBio": a single paste-ready GitHub profile bio for this developer. Max 160 characters (GitHub limit). Professional, first-person or neutral, mention their stack/role and what they build. Do not use hashtags or emoji unless the profile already uses that tone.

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
    `REPOSITORIES FOR DEEP REVIEW (${repositories.length} selected — recent activity, portfolio standouts, and repos that may need polish)`,
    repoLines,
    "",
    `REQUIRED repositoryEvaluations repoName values (use exact spelling): ${repositories.map((r) => r.name).join(", ")}`,
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

function formatValidationErrors(error: ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

async function requestReviewJson(
  client: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<string> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages,
  });

  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw new AppError(502, "The AI model returned an empty response.");
  }
  return content;
}

/**
 * Sends the GitHub payload to the configured model and returns the validated
 * report. Uses JSON mode plus Zod validation for broad provider compatibility.
 */
export async function generateReview(
  payload: GithubProfilePayload
): Promise<LlmReviewReport> {
  const client = getClient();
  const repoNames = payload.repositories.map((repo) => repo.name);
  const baseMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(payload) },
  ];

  let lastContent = "";
  let lastValidationMessage = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      attempt === 0
        ? baseMessages
        : [
            ...baseMessages,
            { role: "assistant", content: lastContent },
            {
              role: "user",
              content: `Your previous JSON failed validation: ${lastValidationMessage}. Return one corrected JSON object only. Include all required top-level fields and exact metric key names.`,
            },
          ];

    try {
      lastContent = await requestReviewJson(client, messages);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown LLM error";
      throw new AppError(502, `AI analysis failed: ${message}`);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(extractJson(lastContent));
    } catch {
      lastValidationMessage = "invalid JSON";
      continue;
    }

    parsedJson = normalizeLlmReviewPayload(parsedJson, repoNames);

    const result = reviewReportSchema.safeParse(parsedJson);
    if (result.success) {
      return result.data;
    }

    lastValidationMessage = formatValidationErrors(result.error);
    console.warn(
      `LLM response validation failed (attempt ${attempt + 1}):`,
      lastValidationMessage
    );
  }

  throw new AppError(
    502,
    "The AI model's response did not match the expected report format."
  );
}
