import type { PlayerSummary } from "@/domain/player";
import {
  createTtlCache,
  NBA_CACHE_TTL_MS,
  type TtlCache,
} from "@/lib/cache/ttlCache";
import { curatedEspnAthleteId } from "@/nba/espn/curatedEspnAthleteIds";
import { resolveEspnAthleteId } from "@/nba/espn/resolveEspnAthleteId";
import { isEspnAthleteId } from "@/nba/headshot";

const defaultEspnResolveCache = createTtlCache({
  ttlMs: NBA_CACHE_TTL_MS,
  maxEntries: 256,
});

export type AttachEspnAthleteIdsOptions = {
  /** Max players to attempt live ESPN resolve for (after curated hits). */
  maxResolve?: number;
  /** Per-player resolve budget; miss → initials. */
  timeoutMs?: number;
  /** Process-local positive-id cache (injectable for tests). */
  cache?: TtlCache;
  /** Resolve implementation (injectable for tests). */
  resolve?: typeof resolveEspnAthleteId;
};

/**
 * Fill `espnAthleteId` on search results: curated map first, then best-effort
 * ESPN search with a short deadline. Never throws — photos are optional.
 *
 * Only successful ESPN ids are cached. Timeouts / network misses stay uncached
 * so the next search can retry.
 */
export async function attachEspnAthleteIds(
  players: PlayerSummary[],
  options: AttachEspnAthleteIdsOptions = {},
): Promise<PlayerSummary[]> {
  const maxResolve = options.maxResolve ?? 8;
  const timeoutMs = options.timeoutMs ?? 450;
  const cache = options.cache ?? defaultEspnResolveCache;
  const resolve = options.resolve ?? resolveEspnAthleteId;

  const withCurated = players.map((player) => {
    if (isEspnAthleteId(player.espnAthleteId)) {
      return player;
    }
    const curated = curatedEspnAthleteId(player.id);
    return curated != null ? { ...player, espnAthleteId: curated } : player;
  });

  const needsResolve = withCurated
    .filter((player) => !isEspnAthleteId(player.espnAthleteId))
    .slice(0, maxResolve);

  if (needsResolve.length === 0) {
    return withCurated;
  }

  const resolved = await Promise.all(
    needsResolve.map(async (player) => {
      const cacheKey = `espnAthlete:bdl:${player.id}`;
      const cached = cache.get<number>(cacheKey);
      if (isEspnAthleteId(cached)) {
        return { id: player.id, espnAthleteId: cached };
      }

      try {
        const id = await resolveWithTimeout(player, timeoutMs, resolve);
        if (isEspnAthleteId(id)) {
          cache.set(cacheKey, id);
        }
        return { id: player.id, espnAthleteId: id };
      } catch {
        return { id: player.id, espnAthleteId: null as number | null };
      }
    }),
  );

  const byId = new Map(
    resolved.map((row) => [row.id, row.espnAthleteId] as const),
  );

  return withCurated.map((player) => {
    if (isEspnAthleteId(player.espnAthleteId)) {
      return player;
    }
    const espnAthleteId = byId.get(player.id);
    return espnAthleteId != null && isEspnAthleteId(espnAthleteId)
      ? { ...player, espnAthleteId }
      : player;
  });
}

async function resolveWithTimeout(
  player: PlayerSummary,
  timeoutMs: number,
  resolve: typeof resolveEspnAthleteId,
): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await resolve(
      {
        firstName: player.firstName,
        lastName: player.lastName,
        teamAbbreviation: player.teamAbbreviation,
      },
      { signal: controller.signal },
    );
  } finally {
    clearTimeout(timer);
  }
}
