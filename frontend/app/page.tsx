"use client";

import { useState, FormEvent } from "react";
import { requestReview } from "@/lib/api";
import { ReviewResponse } from "@/lib/types";
import { ReportDashboard } from "@/components/ReportDashboard";
import { LoadingState } from "@/components/LoadingState";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResponse | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await requestReview(trimmed);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-primary">
          GitReview AI
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-ink sm:text-3xl">
          Let&rsquo;s see what your GitHub says about you.
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          An elite technical recruiter, powered by AI, reads any public GitHub
          profile and writes you an honest, structured review.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">
            @
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="github-username"
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
            className="w-full rounded-lg border-2 border-lineStrong bg-cardAlt py-2.5 pl-8 pr-4 font-mono text-sm text-ink placeholder:text-muted outline-none transition focus:border-primary focus:[box-shadow:0_0_0_3px_rgba(19,111,99,0.22)] disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-cream shadow-warm transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-muted disabled:text-cream disabled:shadow-none"
        >
          {loading ? "Analyzing\u2026" : "Analyze Profile"}
        </button>
      </form>

      <div className="mt-8">
        {loading && <LoadingState />}

        {error && !loading && (
          <div className="mx-auto max-w-xl rounded-lg border border-negative/50 bg-negative/10 px-4 py-2.5 text-center text-sm font-medium text-negative">
            {error}
          </div>
        )}

        {result && !loading && <ReportDashboard data={result} />}
      </div>
    </main>
  );
}
