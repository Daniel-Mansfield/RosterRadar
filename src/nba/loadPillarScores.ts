import type { PillarId } from "@/domain/dossier";
import { AppError } from "@/domain/errors";
import type { PlayerId } from "@/domain/player";
import type { RadarPillarScore } from "@/domain/radarGapReorder";
import { getNbaStatsPort } from "@/nba/getNbaStatsPort";
import { buildPillars } from "@/scoring/composeDossier";

const DEFAULT_SEASON = 2025;

/**
 * Season-line pillar percentiles for Radar gap reorder.
 * Skips recent-game evidence — ranking only needs the same peer percentiles
 * the dossier pillars use.
 */
export async function loadPillarScores(
  playerIds: readonly PlayerId[],
  pillarId: PillarId,
  season: number = DEFAULT_SEASON,
): Promise<RadarPillarScore[]> {
  if (playerIds.length === 0) {
    return [];
  }
  if (new Set(playerIds).size !== playerIds.length) {
    throw new AppError("validation_error", "Player ids must be unique.", 400);
  }

  const nba = getNbaStatsPort();

  return Promise.all(
    playerIds.map(async (playerId) => {
      try {
        let line = await nba.getPlayerSeasonLine(playerId, season);
        if (!line || line.gamesPlayed === 0) {
          line = await nba.getPlayerSeasonLine(playerId, season - 1);
        }
        if (!line) {
          return { playerId, percentile: null };
        }
        const pillar = buildPillars(line).find((row) => row.id === pillarId);
        return { playerId, percentile: pillar?.percentile ?? null };
      } catch {
        return { playerId, percentile: null };
      }
    }),
  );
}
