import { ProfileCompleteness } from "../schemas/reviewSchema";
import { GithubProfile } from "../types/github";

// Weights sum to 100. Higher-impact items (profile README, website, bio) are
// weighted more heavily than nice-to-haves (avatar presence, company).
const WEIGHTS = {
  hasBio: 20,
  hasWebsite: 20,
  hasProfileReadme: 25,
  hasSocialLinks: 15,
  hasAvatar: 10,
  hasCompany: 10,
} as const;

// Friendly, prioritized advice for items the user is missing.
const MISSING_LABELS: Array<{ key: keyof typeof WEIGHTS; label: string }> = [
  { key: "hasProfileReadme", label: "Add a profile README (a {username}/{username} repo) to introduce yourself" },
  { key: "hasBio", label: "Write a concise bio describing what you build" },
  { key: "hasWebsite", label: "Add a personal website or portfolio link" },
  { key: "hasSocialLinks", label: "Link professional social accounts (e.g. LinkedIn)" },
  { key: "hasCompany", label: "Add your company or affiliation" },
  { key: "hasAvatar", label: "Upload a custom profile photo" },
];

export function computeProfileCompleteness(
  profile: GithubProfile
): ProfileCompleteness {
  const checklist = {
    hasAvatar: profile.hasAvatar,
    hasBio: Boolean(profile.bio && profile.bio.trim()),
    hasWebsite: Boolean(profile.website),
    hasSocialLinks: profile.socialAccounts.length > 0,
    hasProfileReadme: Boolean(profile.profileReadme),
    hasCompany: Boolean(profile.company && profile.company.trim()),
  };

  const score = (Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>).reduce(
    (total, key) => (checklist[key] ? total + WEIGHTS[key] : total),
    0
  );

  const missingHighImpactItems = MISSING_LABELS.filter(
    ({ key }) => !checklist[key]
  ).map(({ label }) => label.replace(/\{username\}/g, profile.username));

  return { score, checklist, missingHighImpactItems };
}
