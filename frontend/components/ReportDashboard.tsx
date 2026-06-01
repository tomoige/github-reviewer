import { ReviewResponse } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";
import { MetricCard } from "./MetricCard";
import { LanguageBreakdown } from "./LanguageBreakdown";
import { RepoDeepDive } from "./RepoDeepDive";
import { Roadmap } from "./Roadmap";
import { SummaryCard } from "./SummaryCard";
import { ProfileCompletenessCard } from "./ProfileCompletenessCard";
import { ActivitySnapshotCard } from "./ActivitySnapshotCard";
import { SuggestedBioCard } from "./SuggestedBioCard";
import { PinRecommendationsCard } from "./PinRecommendationsCard";
import { ContributionGraph } from "./ContributionGraph";
import { ReportSection } from "./ReportSection";

export function ReportDashboard({ data }: { data: ReviewResponse }) {
  const { report, profile, username } = data;
  const showSuggestedBio = !report.profileCompleteness.checklist.hasBio;

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Overview ── */}
      <section className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-lineStrong bg-cardAlt p-5 shadow-warm">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              {profile.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={`${username}'s avatar`}
                  className="h-14 w-14 rounded-full border-2 border-lineStrong sepia-[.25] saturate-[.9]"
                />
              )}
              <div>
                <a
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs font-medium text-primaryDark hover:underline"
                >
                  @{username}
                </a>
                <h1 className="mt-0.5 text-xl font-bold leading-tight text-ink sm:text-2xl">
                  {report.profileSummary.headline}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                  <span className="rounded-full border border-line bg-card px-2.5 py-0.5 text-xs font-medium text-ink">
                    {report.profileSummary.estimatedExperienceLevel}
                  </span>
                  <span className="rounded-full border border-line bg-card px-2.5 py-0.5 font-mono text-xs text-muted">
                    {profile.publicRepos} repos
                  </span>
                </div>
              </div>
            </div>
            <ScoreRing score={report.overallScore} label="Overall" />
          </div>
        </div>

        <SummaryCard summary={report.executiveSummary} />
      </section>

      {/* ── Score breakdown ── */}
      <ReportSection
        title="Score breakdown"
        description="How your overall score splits across four areas."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      </ReportSection>

      {/* ── Profile polish ── */}
      <ReportSection
        title="Start here"
        description="Checklist items recruiters notice above the fold on your GitHub profile."
      >
        <div
          className={`grid gap-4 ${showSuggestedBio ? "lg:grid-cols-2" : ""}`}
        >
          <ProfileCompletenessCard completeness={report.profileCompleteness} />
          {showSuggestedBio && (
            <SuggestedBioCard bio={report.suggestedProfileBio} />
          )}
        </div>
      </ReportSection>

      {/* ── Action plan ── */}
      <ReportSection
        title="Your action plan"
        description="Prioritized tasks and repos worth pinning after the basics are covered."
      >
        <div className="space-y-6">
          <Roadmap roadmap={report.personalizedRoadmap} />
          <div className="border-t border-line pt-6">
            <PinRecommendationsCard
              pins={report.pinRecommendations}
              username={username}
            />
          </div>
        </div>
      </ReportSection>

      {/* ── Repo deep dive ── */}
      {(report.repositoryDeepDive.mostRecent.length > 0 ||
        report.repositoryDeepDive.needsImprovement.length > 0 ||
        report.repositoryDeepDive.best.length > 0) && (
        <ReportSection
          title="Repository deep dive"
          description="AI critique with one priority fix per project — switch tabs to compare recent work, weak spots, and standouts."
        >
          <RepoDeepDive deepDive={report.repositoryDeepDive} />
        </ReportSection>
      )}

      {/* ── Activity ── */}
      <ReportSection
        title="Your activity"
        description="Contribution history and repo push patterns — for context."
      >
        <div className="space-y-4">
          <ContributionGraph calendar={data.contributionCalendar} />
          <ActivitySnapshotCard snapshot={report.activitySnapshot} />
        </div>
      </ReportSection>

      {/* ── Reference ── */}
      <ReportSection
        title="Language inventory"
        description="Languages across your scanned public repos — useful context, not a skills test."
      >
        <LanguageBreakdown
          languages={report.languageBreakdownAnalysis}
          languageScan={data.languageScan}
        />
      </ReportSection>
    </div>
  );
}
