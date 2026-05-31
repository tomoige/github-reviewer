import { RepoEvaluation } from "@/lib/types";
import { scoreAccent } from "@/lib/score";

export function RepoCard({ repo }: { repo: RepoEvaluation }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-sm font-semibold text-ink">
          {repo.repoName}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${scoreAccent(
            repo.impactScore
          )}`}
        >
          Impact {repo.impactScore}
        </span>
      </div>

      <p className="mt-2 text-[0.8rem] italic text-muted">
        &ldquo;{repo.visualVibe}&rdquo;
      </p>

      <div className="mt-3 space-y-2.5 text-[0.8rem]">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
            Critique
          </p>
          <p className="mt-0.5 leading-snug text-ink/85">
            {repo.specificCritique}
          </p>
        </div>
        <div className="rounded-lg border-l-2 border-primary bg-cardAlt p-2.5">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-primary">
            Priority Fix
          </p>
          <p className="mt-0.5 text-ink">{repo.priorityFix}</p>
        </div>
      </div>
    </div>
  );
}
