import {
  LanguageBreakdown as LanguageBreakdownType,
  LanguageScanMeta,
} from "@/lib/types";

function competencyAccent(
  rating: LanguageBreakdownType["competencyRating"]
): string {
  switch (rating) {
    case "Advanced":
      return "bg-positive/15 text-positive border-positive/50";
    case "Intermediate":
      return "bg-primary/15 text-primaryDark border-primary/50";
    default:
      return "bg-card text-ink border-lineStrong";
  }
}

function scanSubtitle(scan: LanguageScanMeta): string {
  if (scan.truncated) {
    return `${scan.reposScanned} of ${scan.totalPublicRepos} repos scanned`;
  }
  return `${scan.reposScanned} repos scanned`;
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
        <h3 className="text-base font-bold text-ink">Languages</h3>
        {languageScan && (
          <p className="font-mono text-xs text-muted">
            {scanSubtitle(languageScan)}
          </p>
        )}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-lineStrong font-mono text-xs uppercase tracking-[0.08em] text-muted">
              <th className="pb-2 pr-4 font-medium">Language</th>
              <th className="pb-2 pr-4 font-medium">Repos</th>
              <th className="pb-2 font-medium">Level</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((lang) => (
              <tr key={lang.language} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-4 font-mono font-semibold text-ink">
                  {lang.language}
                </td>
                <td className="py-2.5 pr-4 font-mono text-ink">
                  {lang.repoCount}
                </td>
                <td className="py-2.5">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${competencyAccent(
                      lang.competencyRating
                    )}`}
                  >
                    {lang.competencyRating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
