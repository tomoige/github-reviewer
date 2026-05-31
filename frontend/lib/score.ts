// "Vintage Atlas" palette. Per styles.md the score ring and metric numbers
// use the teal accent; olive green signals positive, oxblood negative.

export const ACCENT = "#136F63"; // deep teal
export const POSITIVE = "#4A7A2C"; // olive
export const NEGATIVE = "#9A3324"; // oxblood

/** Score numbers are consistently the teal accent for a cohesive look. */
export function scoreTextColor(): string {
  return "text-primary";
}

/** Arc / bar fill color for gauges and progress bars. */
export function scoreStroke(): string {
  return ACCENT;
}

/** Warm badge styling for impact scores. */
export function scoreAccent(score: number): string {
  if (score >= 70) return "bg-positive/10 text-positive border-positive/30";
  if (score >= 40) return "bg-primary/10 text-primary border-primary/30";
  return "bg-negative/10 text-negative border-negative/30";
}
