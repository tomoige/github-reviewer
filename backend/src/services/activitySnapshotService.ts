import { ActivitySnapshot } from "../schemas/reviewSchema";
import { GithubProfile, RepoLanguageEntry } from "../types/github";

const ACTIVE_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function formatRelativeDays(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.round(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function formatAccountAge(days: number): string {
  if (days < 30) return `${days} days on GitHub`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "1 month on GitHub" : `${months} months on GitHub`;
  }
  const years = Math.floor(days / 365);
  const rem = Math.round((days % 365) / 30);
  if (rem === 0) return years === 1 ? "1 year on GitHub" : `${years} years on GitHub`;
  return `${years}y ${rem}m on GitHub`;
}

export function computeActivitySnapshot(
  profile: GithubProfile,
  repos: RepoLanguageEntry[]
): ActivitySnapshot {
  const now = new Date();
  let lastPushAt: string | null = null;
  let lastPushDate: Date | null = null;
  let activeInLast90Days = 0;
  let dormantCount = 0;

  for (const repo of repos) {
    const pushed = parseDate(repo.pushedAt);
    if (!pushed) {
      dormantCount += 1;
      continue;
    }

    if (!lastPushDate || pushed > lastPushDate) {
      lastPushDate = pushed;
      lastPushAt = repo.pushedAt;
    }

    const days = daysBetween(pushed, now);
    if (days <= ACTIVE_DAYS) activeInLast90Days += 1;
    else dormantCount += 1;
  }

  const reposScanned = repos.length;
  const activePercent =
    reposScanned > 0 ? Math.round((activeInLast90Days / reposScanned) * 100) : 0;

  const created = parseDate(profile.createdAt);
  const accountAgeDays = created ? daysBetween(created, now) : 0;

  return {
    reposScanned,
    lastPushAt,
    lastPushLabel: lastPushDate
      ? formatRelativeDays(daysBetween(lastPushDate, now))
      : "No push data",
    activeInLast90Days,
    dormantCount,
    activePercent,
    accountCreatedAt: profile.createdAt,
    accountAgeLabel: created ? formatAccountAge(accountAgeDays) : "Unknown",
  };
}
