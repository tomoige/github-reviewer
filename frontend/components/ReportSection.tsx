import { ReactNode } from "react";

export function ReportSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 border-b border-lineStrong pb-2">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
