import { ProfileCompleteness } from "@/lib/types";
import { scoreStroke } from "@/lib/score";

const CHECKLIST_LABELS: Record<
  keyof ProfileCompleteness["checklist"],
  string
> = {
  hasAvatar: "Custom profile photo",
  hasBio: "Bio",
  hasWebsite: "Website / portfolio",
  hasSocialLinks: "Social links",
  hasProfileReadme: "Profile README",
  hasCompany: "Company",
};

export function ProfileCompletenessCard({
  completeness,
}: {
  completeness: ProfileCompleteness;
}) {
  const entries = Object.entries(completeness.checklist) as Array<
    [keyof ProfileCompleteness["checklist"], boolean]
  >;

  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold text-ink">Profile Completeness</h2>
        <span className="font-mono text-2xl font-bold text-primary">
          {completeness.score}
          <span className="text-xs font-normal text-muted">/100</span>
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cardAlt">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${completeness.score}%`,
            backgroundColor: scoreStroke(),
          }}
        />
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-3">
        {entries.map(([key, done]) => (
          <li key={key} className="flex items-center gap-2 text-[0.8rem]">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-positive/15 text-positive"
                  : "bg-negative/15 text-negative"
              }`}
            >
              {done ? "\u2713" : "\u2717"}
            </span>
            <span className={done ? "text-ink/85" : "text-muted"}>
              {CHECKLIST_LABELS[key]}
            </span>
          </li>
        ))}
      </ul>

      {completeness.missingHighImpactItems.length > 0 && (
        <div className="mt-4 rounded-lg border-l-2 border-primary bg-cardAlt p-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
            Quick wins
          </p>
          <ul className="mt-1.5 space-y-0.5 text-[0.8rem] text-ink/85">
            {completeness.missingHighImpactItems.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
