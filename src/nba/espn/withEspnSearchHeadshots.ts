import type { NbaStatsPort, SearchPlayersInput } from "@/nba/port";
import { attachEspnAthleteIds } from "@/nba/espn/attachEspnAthleteIds";

/**
 * Decorates a stats port so acquisition search gets headshot ids after the
 * inner port returns (and after any BDL search TTL cache).
 *
 * Keeps ESPN resolve out of the BDL cache entry so a slow first photo attempt
 * cannot freeze initials for the full search TTL.
 */
export function withEspnSearchHeadshots(inner: NbaStatsPort): NbaStatsPort {
  return {
    searchPlayers(input: SearchPlayersInput) {
      return inner
        .searchPlayers(input)
        .then((players) => attachEspnAthleteIds(players));
    },
    getNetsRoster: () => inner.getNetsRoster(),
    getPlayerSeasonLine: (playerId, season) =>
      inner.getPlayerSeasonLine(playerId, season),
    getPlayerRecentGames: (playerId, season, perPage) =>
      inner.getPlayerRecentGames(playerId, season, perPage),
  };
}
