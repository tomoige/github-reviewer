import { NextFunction, Request, Response } from "express";
import { getProfilePayload } from "../services/githubService";
import { generateReview } from "../services/aiService";
import { computeProfileCompleteness } from "../services/completenessService";
import { reviewRepository } from "../repositories/reviewRepository";
import { ReviewReport } from "../schemas/reviewSchema";
import { GithubProfile, ProfileBasics } from "../types/github";
import { AppError } from "../utils/AppError";

function toProfileBasics(profile: GithubProfile): ProfileBasics {
  return {
    username: profile.username,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    company: profile.company,
    website: profile.website,
    followers: profile.followers,
    following: profile.following,
    publicRepos: profile.publicRepos,
  };
}

// GitHub username rules: 1-39 chars, alphanumeric or single hyphens.
const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

/**
 * POST /api/review
 * Validates the username, coordinates the github + ai services, and returns the
 * structured report. Contains no business logic or external API calls itself.
 */
export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawUsername = (req.body?.username ?? "").toString().trim();

    if (!rawUsername) {
      throw new AppError(400, "A GitHub username is required.");
    }
    if (!USERNAME_PATTERN.test(rawUsername)) {
      throw new AppError(400, "That is not a valid GitHub username.");
    }

    const cached = reviewRepository.get(rawUsername);
    if (cached) {
      res.status(200).json({
        username: cached.profile.username,
        cached: true,
        profile: cached.profile,
        report: cached.report,
        languageScan: cached.languageScan,
      });
      return;
    }

    const payload = await getProfilePayload(rawUsername);
    const llmReport = await generateReview(payload);

    // Merge the deterministic, code-computed completeness into the LLM report.
    const report: ReviewReport = {
      ...llmReport,
      profileCompleteness: computeProfileCompleteness(payload.profile),
    };
    const profile = toProfileBasics(payload.profile);

    reviewRepository.save(rawUsername, {
      profile,
      report,
      languageScan: payload.languageScan,
    });

    res.status(200).json({
      username: payload.profile.username,
      cached: false,
      profile,
      report,
      languageScan: payload.languageScan,
    });
  } catch (error) {
    next(error);
  }
}
