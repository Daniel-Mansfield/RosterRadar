import type { PlayerSummary } from "@/domain/player";
import { createTtlCache, NBA_CACHE_TTL_MS } from "@/lib/cache/ttlCache";
import { curatedEspnAthleteId } from "@/nba/espn/curatedEspnAthleteIds";
import { resolveEspnAthleteId } from "@/nba/espn/resolveEspnAthleteId";
import { isEspnAthleteId } from "@/nba/headshot";

const espnResolveCache = createTtlCache({
  ttlMs: NBA_CACHE_TTL_MS,
  maxEntries: 256,
});

export type AttachEspnAthleteIdsOptions = {
  /** Max players to attempt live ESPN resolve for (after curated hits). */
  maxResolve?: number;
  /** Per-player resolve budget; miss → initials. */
  timeoutMs?: number;
};

/**
 * Fill `espnAthleteId` on search results: curated map first, then best-effort
 * ESPN search with a short deadline. Never throws — photos are optional.
 */
export async function attachEspnAthleteIds(
  players: PlayerSummary[],
  options: AttachEspnAthleteIdsOptions = {},
): Promise<PlayerSummary[]> {
  const maxResolve = options.maxResolve ?? 8;
  const timeoutMs = options.timeoutMs ?? 450;

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
      try {
        const id = await espnResolveCache.getOrSet(cacheKey, () =>
          resolveWithTimeout(player, timeoutMs),
        );
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
): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await resolveEspnAthleteId(
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
