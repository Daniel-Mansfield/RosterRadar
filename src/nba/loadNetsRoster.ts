import { createBalldontlieAdapter } from "@/nba/balldontlie/client";
import type { NetsRoster } from "@/domain/player";

/**
 * Application entry for the curated Nets roster.
 * Used by the RSC home page and GET /api/roster/nets so both share one path.
 */
export async function loadNetsRoster(): Promise<NetsRoster> {
  return createBalldontlieAdapter().getNetsRoster();
}
