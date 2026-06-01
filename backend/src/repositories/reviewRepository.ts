import { ContributionCalendar, ReviewReport } from "../schemas/reviewSchema";
import { ProfileBasics, LanguageScanMeta } from "../types/github";

/**
 * MVP placeholder repository. The spec forbids a real database/ORM, so this is
 * a short-lived in-memory cache keyed by username. It keeps the controller free
 * of storage concerns and gives Phase 2 (DB integration) a drop-in seam.
 */

export interface StoredReview {
  profile: ProfileBasics;
  report: ReviewReport;
  languageScan: LanguageScanMeta;
  contributionCalendar: ContributionCalendar | null;
}

interface CachedEntry extends StoredReview {
  cachedAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map<string, CachedEntry>();

function key(username: string): string {
  return username.trim().toLowerCase();
}

export const reviewRepository = {
  get(username: string): StoredReview | null {
    const entry = store.get(key(username));
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > TTL_MS) {
      store.delete(key(username));
      return null;
    }
    return {
      profile: entry.profile,
      report: entry.report,
      languageScan: entry.languageScan,
      contributionCalendar: entry.contributionCalendar,
    };
  },

  save(username: string, value: StoredReview): void {
    store.set(key(username), { ...value, cachedAt: Date.now() });
  },
};
