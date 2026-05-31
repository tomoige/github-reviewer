export function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border-l-4 border-negative bg-summaryBg p-5 shadow-warm-lg">
      {/* Wax-seal style mark in the top-right corner */}
      <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-negative/80 text-cream shadow-inner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2c.6 2.5-1 3.8-1 6 0 1.7 1.3 3 3 3 .5 0 1-.1 1.4-.4.2 1 .6 1.9.6 2.9a4 4 0 1 1-7.6-1.7C9.2 9.6 11 6.4 12 2z" />
        </svg>
      </div>

      <h2 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-cream/80">
        The Honest Assessment
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-summaryText">
        {summary}
      </p>
    </div>
  );
}
