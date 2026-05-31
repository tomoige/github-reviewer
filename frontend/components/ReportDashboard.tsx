import { ReviewResponse } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";
import { MetricCard } from "./MetricCard";
import { LanguageBreakdown } from "./LanguageBreakdown";
import { RepoCard } from "./RepoCard";
import { Roadmap } from "./Roadmap";
import { SummaryCard } from "./SummaryCard";
import { ProfileCompletenessCard } from "./ProfileCompletenessCard";

export function ReportDashboard({ data }: { data: ReviewResponse }) {
  const { report, profile, username } = data;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Hero header */}
      <section className="overflow-hidden rounded-lg border border-line bg-cardAlt p-5 shadow-warm">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            {profile.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={`${username}'s avatar`}
                className="h-14 w-14 rounded-full border-2 border-line sepia-[.35] saturate-[.85]"
              />
            )}
            <div>
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs font-medium text-primary hover:underline"
              >
                @{username}
              </a>
              <h1 className="mt-0.5 text-xl font-bold leading-tight text-ink sm:text-2xl">
                {report.profileSummary.headline}
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <span className="rounded-full border border-line bg-card px-2.5 py-0.5 text-xs text-muted">
                  {report.profileSummary.estimatedExperienceLevel}
                </span>
                <span className="rounded-full border border-line bg-card px-2.5 py-0.5 font-mono text-xs text-muted">
                  {profile.followers} followers
                </span>
                <span className="rounded-full border border-line bg-card px-2.5 py-0.5 font-mono text-xs text-muted">
                  {profile.publicRepos} repos
                </span>
              </div>
            </div>
          </div>
          <ScoreRing score={report.overallScore} label="Overall" />
        </div>
      </section>

      {/* Executive summary — lead with the narrative */}
      <SummaryCard summary={report.executiveSummary} />

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Documentation" metric={report.metrics.documentation} />
        <MetricCard title="Code Quality" metric={report.metrics.codeQuality} />
        <MetricCard
          title="Activity & Velocity"
          metric={report.metrics.activityAndVelocity}
        />
        <MetricCard
          title="Profile Presentation"
          metric={report.metrics.profilePresentation}
        />
      </section>

      {/* Profile completeness checklist */}
      <ProfileCompletenessCard completeness={report.profileCompleteness} />

      {/* Languages */}
      <LanguageBreakdown
        languages={report.languageBreakdownAnalysis}
        languageScan={data.languageScan}
      />

      {/* Repositories */}
      {report.mostRecentRepositoriesEvaluated.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold text-ink">
            Most Recent Repositories Evaluated
          </h2>
          <p className="mb-3 text-[0.8rem] text-muted">
            The 5 public repos you own with the most recent push activity.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {report.mostRecentRepositoriesEvaluated.map((repo, i, repos) => {
              const isLastOdd =
                repos.length % 2 === 1 && i === repos.length - 1;
              return (
                <div key={i} className={isLastOdd ? "lg:col-span-2" : undefined}>
                  <RepoCard repo={repo} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Roadmap */}
      <Roadmap roadmap={report.personalizedRoadmap} />
    </div>
  );
}
