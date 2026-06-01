import { PinRecommendation } from "@/lib/types";

export function PinRecommendationsCard({
  pins,
  username,
}: {
  pins: PinRecommendation[];
  username: string;
}) {
  if (pins.length === 0) return null;

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-bold text-ink">Pin recommendations</h3>
        <p className="mt-0.5 text-sm text-muted">
          Up to 6 repos worth pinning — ranked by stars, README, and recency.
        </p>
      </div>

      <ol className="overflow-hidden rounded-lg border border-line bg-card">
        {pins.map((pin, i) => (
          <li
            key={pin.repoName}
            className="group flex gap-4 border-b border-line px-4 py-3.5 last:border-b-0 transition-colors hover:bg-cardAlt/40"
          >
            <span className="w-5 shrink-0 pt-0.5 font-mono text-xs tabular-nums text-muted">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <a
                  href={`https://github.com/${username}/${pin.repoName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-sm font-semibold text-primaryDark underline-offset-2 hover:underline"
                >
                  {pin.repoName}
                </a>
                <span className="font-mono text-xs text-muted">
                  {pin.stars} {pin.stars === 1 ? "star" : "stars"}
                  {pin.language ? ` · ${pin.language}` : ""}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink/90">
                {pin.reason}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
