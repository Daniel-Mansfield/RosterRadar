import type { NetsRoster } from "@/domain/player";
import { getNbaStatsPort } from "@/nba/getNbaStatsPort";

/**
 * Application entry for the curated Nets roster.
 * Used by the RSC home page and GET /api/roster/nets so both share one path.
 */
export async function loadNetsRoster(): Promise<NetsRoster> {
  return getNbaStatsPort().getNetsRoster();
}
