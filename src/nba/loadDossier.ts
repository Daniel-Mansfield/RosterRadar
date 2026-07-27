import type { Dossier } from "@/domain/dossier";
import { AppError } from "@/domain/errors";
import type { PlayerId } from "@/domain/player";
import { createBalldontlieAdapter } from "@/nba/balldontlie/client";
import { composeDossierFromLines } from "@/scoring/composeDossier";

const DEFAULT_SEASON = 2025;

/**
 * Build a role-fit dossier for a BALLDONTLIE player id (acquisition path).
 */
export async function loadDossier(
  playerId: PlayerId,
  season: number = DEFAULT_SEASON,
): Promise<Dossier> {
  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new AppError("validation_error", "Player id must be a positive integer.", 400);
  }

  const nba = createBalldontlieAdapter();

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

  const games = await nba.getPlayerRecentGames(playerId, usedSeason, 30);

  return composeDossierFromLines({
    line: { ...line, season: usedSeason },
    games,
    teamAbbreviation: line.teamAbbreviation,
  });
}
