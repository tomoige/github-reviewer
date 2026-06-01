// "Vintage Atlas" palette. Per styles.md the score ring and metric numbers
// use the teal accent; olive green signals positive, oxblood negative.

export const ACCENT = "#136F63"; // deep teal
export const POSITIVE = "#3D6824"; // olive
export const NEGATIVE = "#8A2D20"; // oxblood
export const BORDER = "#A39684"; // card/divider border
export const EMPTY_CELL = "#B5AD9E"; // contribution graph empty square
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
  if (score >= 70) return "bg-positive/15 text-positive border-positive/50";
  if (score >= 40) return "bg-primary/15 text-primaryDark border-primary/50";
  return "bg-negative/15 text-negative border-negative/50";}
