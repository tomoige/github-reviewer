import { ActivitySnapshot } from "@/lib/types";

export function ActivitySnapshotCard({
  snapshot,
}: {
  snapshot: ActivitySnapshot;
}) {
  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <h3 className="text-base font-bold text-ink">Activity Snapshot</h3>
      <p className="mt-1 text-sm text-muted">
        Factual signals from your scanned public repos (last 90 days).
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-line bg-cardAlt p-3">
          <dt className="type-label">
            Last push
          </dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-ink">
            {snapshot.lastPushLabel}
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-cardAlt p-3">
          <dt className="type-label">
            Active repos
          </dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-primary">
            {snapshot.activeInLast90Days}/{snapshot.reposScanned}
            <span className="ml-1 text-xs font-normal text-muted">
              ({snapshot.activePercent}%)
            </span>
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-cardAlt p-3">
          <dt className="type-label">
            Dormant
          </dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-ink">
            {snapshot.dormantCount}
            <span className="ml-1 text-xs font-normal text-muted">
              no push in 90d+
            </span>
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-cardAlt p-3">
          <dt className="type-label">
            GitHub tenure
          </dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-ink">
            {snapshot.accountAgeLabel}
          </dd>
        </div>
      </dl>
    </div>
  );
}
