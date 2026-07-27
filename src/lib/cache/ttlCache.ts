type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type TtlCacheOptions = {
  /** Time-to-live for successful entries. */
  ttlMs: number;
  /** Soft cap; least-recently-used entries are dropped when exceeded. */
  maxEntries?: number;
};

/** Default TTL for normalized NBA domain reads (scouting data, not live box). */
export const NBA_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Process-local TTL cache with in-flight coalescing (singleflight).
 * Caches successful results only — loaders that throw are not stored.
 * `get` refreshes LRU order so hot keys survive eviction under pressure.
 */
export function createTtlCache(options: TtlCacheOptions) {
  const { ttlMs, maxEntries = 256 } = options;
  const store = new Map<string, CacheEntry<unknown>>();
  const inflight = new Map<string, Promise<unknown>>();

  function pruneExpired(now: number): void {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }

  function evictOverflow(): void {
    while (store.size > maxEntries) {
      const oldest = store.keys().next().value;
      if (oldest === undefined) break;
      store.delete(oldest);
    }
  }

  function get<T>(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }
    // Refresh LRU insertion order without extending TTL.
    store.delete(key);
    store.set(key, entry);
    return entry.value as T;
  }

  function set<T>(key: string, value: T): void {
    const now = Date.now();
    pruneExpired(now);
    if (store.has(key)) store.delete(key);
    store.set(key, { value, expiresAt: now + ttlMs });
    evictOverflow();
  }

  async function getOrSet<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = get<T>(key);
    if (cached !== undefined) return cached;

    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;

    const promise = loader()
      .then((value) => {
        set(key, value);
        return value;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, promise);
    return promise;
  }

  function clear(): void {
    store.clear();
    inflight.clear();
  }

  function size(): number {
    return store.size;
  }

  return { get, set, getOrSet, clear, size };
}

export type TtlCache = ReturnType<typeof createTtlCache>;
