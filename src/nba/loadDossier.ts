import type { Dossier } from "@/domain/dossier";
import { AppError } from "@/domain/errors";
import type { PlayerId } from "@/domain/player";
import { getNbaResponseCache, getNbaStatsPort } from "@/nba/getNbaStatsPort";
import { composeDossierFromLines } from "@/scoring/composeDossier";

const DEFAULT_SEASON = 2025;
/** Matches dossier evidence window; keep aligned with cachedPort default. */
const RECENT_GAMES_PAGE = 30;

/**
 * Build a role-fit dossier for a BALLDONTLIE player id (acquisition path).
 * Composed dossiers share the process-local NBA response cache (TTL).
 */
export async function loadDossier(
  playerId: PlayerId,
  season: number = DEFAULT_SEASON,
): Promise<Dossier> {
  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new AppError("validation_error", "Player id must be a positive integer.", 400);
  }

  return getNbaResponseCache().getOrSet(`dossier:${playerId}:${season}`, () =>
    buildDossier(playerId, season),
  );
}

async function buildDossier(
  playerId: PlayerId,
  season: number,
): Promise<Dossier> {
  const nba = getNbaStatsPort();

  let line = await nba.getPlayerSeasonLine(playerId, season);
  let usedSeason = season;
  if (!line || line.gamesPlayed === 0) {
    const prior = season - 1;
    line = await nba.getPlayerSeasonLine(playerId, prior);
    usedSeason = prior;
  }

  if (!line) {
    throw new AppError(
      "not_found",
      `No season averages found for player ${playerId}.`,
      404,
    );
  }

  const games = await nba.getPlayerRecentGames(
    playerId,
    usedSeason,
    RECENT_GAMES_PAGE,
  );

  return composeDossierFromLines({
    line: { ...line, season: usedSeason },
    games,
    teamAbbreviation: line.teamAbbreviation,
  });
}
