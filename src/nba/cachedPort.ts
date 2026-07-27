import type { PlayerGameLine, PlayerSeasonLine } from "@/domain/dossier";
import type { NetsRoster, PlayerSummary } from "@/domain/player";
import { createTtlCache, NBA_CACHE_TTL_MS, type TtlCache } from "@/lib/cache/ttlCache";
import { searchQuerySchema } from "@/lib/api/schemas";
import type { NbaStatsPort, SearchPlayersInput } from "@/nba/port";

export type CachedNbaPortOptions = {
  ttlMs?: number;
  cache?: TtlCache;
};

/**
 * Read-through cache over an NbaStatsPort.
 * Caches post-Zod domain values only; scoring stays outside.
 * Callers must treat returned values as read-only (shared cache entries).
 */
export function createCachedNbaPort(
  inner: NbaStatsPort,
  options: CachedNbaPortOptions = {},
): NbaStatsPort {
  const cache =
    options.cache ??
    createTtlCache({
      ttlMs: options.ttlMs ?? NBA_CACHE_TTL_MS,
      maxEntries: 512,
    });

  return {
    async searchPlayers(input: SearchPlayersInput): Promise<PlayerSummary[]> {
      const parsedQuery = searchQuerySchema.safeParse(input.query);
      if (!parsedQuery.success) {
        // Keep validation ownership on the inner adapter; do not cache failures.
        return inner.searchPlayers(input);
      }

      const q = parsedQuery.data.toLowerCase();
      const exclude = input.excludeNets === true ? "1" : "0";
      return cache.getOrSet(`search:${q}:excludeNets=${exclude}`, () =>
        inner.searchPlayers({ ...input, query: parsedQuery.data }),
      );
    },

    getNetsRoster(): Promise<NetsRoster> {
      return cache.getOrSet("roster:nets", () => inner.getNetsRoster());
    },

    getPlayerSeasonLine(
      playerId,
      season,
    ): Promise<PlayerSeasonLine | null> {
      return cache.getOrSet(`season:${playerId}:${season}`, () =>
        inner.getPlayerSeasonLine(playerId, season),
      );
    },

    getPlayerRecentGames(
      playerId,
      season,
      perPage = 30,
    ): Promise<PlayerGameLine[]> {
      return cache.getOrSet(`games:${playerId}:${season}:${perPage}`, () =>
        inner.getPlayerRecentGames(playerId, season, perPage),
      );
    },
  };
}

export { NBA_CACHE_TTL_MS };
