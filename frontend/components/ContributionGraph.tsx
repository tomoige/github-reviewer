import type { CSSProperties } from "react";
import { ContributionCalendar } from "@/lib/types";
import { EMPTY_CELL } from "@/lib/score";

const PRIMARY_RGB = "19, 111, 99";
const LEVEL_OPACITY = [0, 0.35, 0.55, 0.75, 1];

function levelStyle(level: number): CSSProperties {
  if (level <= 0) return { backgroundColor: EMPTY_CELL };
  const opacity = LEVEL_OPACITY[Math.min(level, 4)] ?? 1;
  return { backgroundColor: `rgba(${PRIMARY_RGB}, ${opacity})` };
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function breakdownParts(calendar: ContributionCalendar): string[] {
  const { breakdown } = calendar;
  const parts: string[] = [];

  if (breakdown.commits > 0) {
    parts.push(`${breakdown.commits.toLocaleString()} commits`);
  }
  if (breakdown.pullRequests > 0) {
    parts.push(`${breakdown.pullRequests.toLocaleString()} PRs`);
  }
  if (breakdown.reviews > 0) {
    parts.push(`${breakdown.reviews.toLocaleString()} reviews`);
  }
  if (breakdown.issues > 0) {
    parts.push(`${breakdown.issues.toLocaleString()} issues`);
  }

  return parts;
}

export function ContributionGraph({
  calendar,
}: {
  calendar: ContributionCalendar | null;
}) {
  const orgRepos =
    calendar?.repositories.filter((repo) => repo.ownerType === "Organization") ??
    [];
  const personalRepos =
    calendar?.repositories.filter((repo) => repo.ownerType === "User") ?? [];
  const breakdownText = calendar ? breakdownParts(calendar).join(" · ") : "";

  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-ink">Contribution Activity</h3>
        {calendar && (
          <p className="font-mono text-xs text-muted">
            {calendar.totalContributions.toLocaleString()} contributions in the
            last year
          </p>
        )}
      </div>

      {!calendar ? (
        <p className="mt-3 text-sm text-muted">
          Contribution graph unavailable. Add a{" "}
          <code className="font-mono text-xs">GITHUB_TOKEN</code> to your
          backend environment to enable it.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            {calendar.includesPrivateContributions
              ? "Showing activity visible to your backend token (includes private repos the token can access)."
              : "Public contributions only — GitHub does not expose private activity for other users."}
          </p>

          {calendar.hasHiddenContributions &&
            calendar.restrictedContributionCount != null &&
            calendar.restrictedContributionCount > 0 && (
              <p className="mt-2 rounded-md border border-line bg-cardAlt px-3 py-2 text-sm text-ink">
                GitHub reports{" "}
                <span className="font-mono text-ink">
                  {calendar.restrictedContributionCount.toLocaleString()}
                </span>{" "}
                additional contributions in repositories this token cannot
                access (often organization or private repos).
              </p>
            )}

          {calendar.includesPrivateContributions && (
            <p className="mt-2 rounded-md border border-line bg-cardAlt px-3 py-2 text-sm text-ink">
              If this total is lower than your GitHub profile, your{" "}
              <code className="font-mono text-xs">GITHUB_TOKEN</code> likely
              lacks access to organization or private repositories you contribute
              to. Fine-grained tokens must grant access to all repositories
              you work in — or use a classic token with{" "}
              <code className="font-mono text-xs">repo</code>,{" "}
              <code className="font-mono text-xs">read:user</code>, and{" "}
              <code className="font-mono text-xs">read:org</code> scopes.
            </p>
          )}

          <div className="mt-4 overflow-x-auto pb-1">
            <div className="inline-flex min-w-min gap-[3px]">
              {calendar.weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex flex-col gap-[3px]"
                  aria-hidden
                >
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.count} contribution${day.count === 1 ? "" : "s"} on ${formatDate(day.date)}`}
                      style={levelStyle(day.level)}
                      className="h-[11px] w-[11px] rounded-sm"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                style={levelStyle(level)}
                className="h-[11px] w-[11px] rounded-sm"
              />
            ))}
            <span>More</span>
          </div>

          {(breakdownText || calendar.repositories.length > 0) && (
            <div className="mt-4 border-t border-lineStrong pt-3">
              {breakdownText && (
                <p className="text-sm text-ink">
                  Breakdown: {breakdownText}
                </p>
              )}

              {calendar.repositories.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-ink">
                    Repositories included in this count
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {calendar.repositories.slice(0, 10).map((repo) => (
                      <li
                        key={repo.fullName}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm"
                      >
                        <span className="font-mono font-medium text-ink">{repo.fullName}</span>
                        <span className="text-muted">
                          {repo.contributionCount.toLocaleString()} commits
                          {repo.ownerType === "Organization" && " · org"}
                          {repo.isPrivate && " · private"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {orgRepos.length === 0 && personalRepos.length > 0 && (
                    <p className="mt-2 text-sm text-muted">
                      No organization repositories appear — org activity is
                      missing if your token does not include those repos.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
