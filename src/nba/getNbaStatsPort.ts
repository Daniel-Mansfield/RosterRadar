import { createTtlCache, NBA_CACHE_TTL_MS, type TtlCache } from "@/lib/cache/ttlCache";
import { createBalldontlieAdapter } from "@/nba/balldontlie/client";
import { createCachedNbaPort } from "@/nba/cachedPort";
import type { NbaStatsPort } from "@/nba/port";

/**
 * One process-local store for port reads + composed dossiers (shared maxEntries budget).
 */
const responseCache: TtlCache = createTtlCache({
  ttlMs: NBA_CACHE_TTL_MS,
  maxEntries: 512,
});

let port: NbaStatsPort | null = null;

/**
 * Shared NbaStatsPort for the process: BALLDONTLIE adapter + TTL read-through cache.
 * Cache is process-local (warm serverless instances / local dev); not a shared Redis store.
 */
export function getNbaStatsPort(): NbaStatsPort {
  if (!port) {
    port = createCachedNbaPort(createBalldontlieAdapter(), {
      cache: responseCache,
    });
  }
  return port;
}

/** Shared TTL store (dossier keys live alongside port keys). */
export function getNbaResponseCache(): TtlCache {
  return responseCache;
}

/** Test helper — drop the singleton and clear cached entries. */
export function resetNbaStatsPortForTests(): void {
  port = null;
  responseCache.clear();
}
