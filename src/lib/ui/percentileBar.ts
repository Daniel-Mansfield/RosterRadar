/**
 * Shared percentile bar thresholds for dossier + Lineup Fit.
 * Strong matches callout strength (70); poor matches gap callout (45)
 * so bars and balance language stay consistent.
 */
export const PERCENTILE_BAR_STRONG = 70;
export const PERCENTILE_BAR_POOR = 45;

export type PercentileBarTone = "strong" | "mid" | "poor";

export function percentileBarTone(percentile: number): PercentileBarTone {
  if (percentile >= PERCENTILE_BAR_STRONG) return "strong";
  if (percentile <= PERCENTILE_BAR_POOR) return "poor";
  return "mid";
}
