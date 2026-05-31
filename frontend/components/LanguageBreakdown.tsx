import {
  LanguageBreakdown as LanguageBreakdownType,
  LanguageScanMeta,
} from "@/lib/types";

function competencyAccent(
  rating: LanguageBreakdownType["competencyRating"]
): string {
  switch (rating) {
    case "Advanced":
      return "bg-positive/10 text-positive border-positive/30";
    case "Intermediate":
      return "bg-primary/10 text-primary border-primary/30";
    default:
      return "bg-cardAlt text-muted border-line";
  }
}

function scanSubtitle(scan: LanguageScanMeta): string {
  if (scan.truncated) {
    return `Based on ${scan.reposScanned} of ${scan.totalPublicRepos} public repos (most recently pushed)`;
  }
  return `Based on all ${scan.reposScanned} public repos`;
}

export function LanguageBreakdown({
  languages,
  languageScan,
}: {
  languages: LanguageBreakdownType[];
  languageScan?: LanguageScanMeta;
}) {
  if (languages.length === 0) return null;

  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-ink">Language Breakdown</h2>
        {languageScan && (
          <p className="font-mono text-[0.65rem] text-muted">
            {scanSubtitle(languageScan)}
          </p>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {languages.map((lang, i) => (
          <div key={i} className="rounded-lg border border-line bg-cardAlt p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-ink">
                {lang.language}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-medium ${competencyAccent(
                  lang.competencyRating
                )}`}
              >
                {lang.competencyRating}
              </span>
            </div>

            <div className="mt-2">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
                Why this rating
              </p>
              <p className="mt-1 text-[0.8rem] leading-snug text-ink/90">
                {lang.ratingRationale}
              </p>
            </div>

            {lang.context && (
              <div className="mt-2 border-t border-line/70 pt-2">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
                  Portfolio usage
                </p>
                <p className="mt-1 text-[0.8rem] leading-snug text-muted">
                  {lang.context}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
