"use client";

import { useState } from "react";

export function SuggestedBioCard({ bio }: { bio: string }) {
  const [copied, setCopied] = useState(false);

  async function copyBio() {
    try {
      await navigator.clipboard.writeText(bio);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-warm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-ink">Suggested Profile Bio</h3>
        <span className="font-mono text-[0.65rem] text-muted">
          {bio.length}/160 chars
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Paste this into your GitHub profile bio field.
      </p>

      <blockquote className="mt-3 rounded-lg border border-line bg-cardAlt p-3 text-sm leading-relaxed text-ink">
        {bio}
      </blockquote>

      <button
        type="button"
        onClick={copyBio}
        className="mt-3 rounded-lg border border-lineStrong bg-cardAlt px-4 py-2 text-sm font-medium text-ink transition hover:border-primary hover:bg-card"
      >
        {copied ? "Copied!" : "Copy bio"}
      </button>
    </div>
  );
}
