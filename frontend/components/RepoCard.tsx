import { RepoEvaluation } from "@/lib/types";
import { scoreAccent } from "@/lib/score";

export function RepoCard({
  repo,
  variant = "card",
}: {
  repo: RepoEvaluation;
  variant?: "card" | "list";
}) {
  if (variant === "list") {
    return (
      <article className="px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="font-mono text-sm font-semibold text-ink">
            {repo.repoName}
          </h4>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${scoreAccent(
              repo.impactScore
            )}`}
          >
            Impact {repo.impactScore}
          </span>
        </div>

        <p className="mt-1.5 text-sm italic leading-relaxed text-muted">
          {repo.visualVibe}
        </p>

        <p className="mt-2.5 text-sm leading-relaxed text-ink">
          {repo.specificCritique}
        </p>

        <div className="mt-3 border-l-2 border-primary pl-3">
          <p className="type-label text-primaryDark">Priority fix</p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink">
            {repo.priorityFix}
          </p>
        </div>
      </article>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-sm font-semibold text-ink">
          {repo.repoName}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${scoreAccent(
            repo.impactScore
          )}`}
        >
          Impact {repo.impactScore}
        </span>
      </div>

      <p className="mt-2 text-sm italic text-muted">&ldquo;{repo.visualVibe}&rdquo;</p>

      <div className="mt-3 space-y-2.5 text-sm">
        <div>
          <p className="type-label">Critique</p>
          <p className="mt-0.5 leading-relaxed text-ink">
            {repo.specificCritique}
          </p>
        </div>
        <div className="border-l-2 border-primary pl-3">
          <p className="type-label text-primaryDark">Priority fix</p>
          <p className="mt-0.5 text-ink">{repo.priorityFix}</p>
        </div>
      </div>
    </div>
  );
}
