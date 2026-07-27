import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createTtlCache } from "@/lib/cache/ttlCache";

describe("createTtlCache", () => {
  it("returns cached value within TTL", async () => {
    const cache = createTtlCache({ ttlMs: 60_000 });
    let loads = 0;
    const first = await cache.getOrSet("k", async () => {
      loads += 1;
      return "a";
    });
    const second = await cache.getOrSet("k", async () => {
      loads += 1;
      return "b";
    });
    assert.equal(first, "a");
    assert.equal(second, "a");
    assert.equal(loads, 1);
  });

  it("coalesces concurrent loaders for the same key", async () => {
    const cache = createTtlCache({ ttlMs: 60_000 });
    let loads = 0;
    const loader = async (): Promise<number> => {
      loads += 1;
      await new Promise((r) => setTimeout(r, 20));
      return loads;
    };
    const [a, b] = await Promise.all([
      cache.getOrSet("same", loader),
      cache.getOrSet("same", loader),
    ]);
    assert.equal(a, 1);
    assert.equal(b, 1);
    assert.equal(loads, 1);
  });

  it("does not cache rejected loaders", async () => {
    const cache = createTtlCache({ ttlMs: 60_000 });
    await assert.rejects(() =>
      cache.getOrSet("err", async () => {
        throw new Error("boom");
      }),
    );
    let loads = 0;
    const value = await cache.getOrSet("err", async () => {
      loads += 1;
      return "ok";
    });
    assert.equal(value, "ok");
    assert.equal(loads, 1);
  });

  it("caches null results", async () => {
    const cache = createTtlCache({ ttlMs: 60_000 });
    let loads = 0;
    const first = await cache.getOrSet<null>("n", async () => {
      loads += 1;
      return null;
    });
    const second = await cache.getOrSet<null>("n", async () => {
      loads += 1;
      return null;
    });
    assert.equal(first, null);
    assert.equal(second, null);
    assert.equal(loads, 1);
  });

  it("reloads after TTL expiry", async () => {
    const cache = createTtlCache({ ttlMs: 25 });
    assert.equal(await cache.getOrSet("k", async () => 1), 1);
    await new Promise((r) => setTimeout(r, 35));
    let loads = 0;
    assert.equal(
      await cache.getOrSet("k", async () => {
        loads += 1;
        return 2;
      }),
      2,
    );
    assert.equal(loads, 1);
  });

  it("evicts least-recently-used when over maxEntries", async () => {
    const cache = createTtlCache({ ttlMs: 60_000, maxEntries: 2 });
    await cache.getOrSet("a", async () => "a");
    await cache.getOrSet("b", async () => "b");
    // Touch "a" so "b" becomes the LRU victim.
    assert.equal(cache.get("a"), "a");
    await cache.getOrSet("c", async () => "c");
    assert.equal(cache.get("a"), "a");
    assert.equal(cache.get("c"), "c");
    assert.equal(cache.get("b"), undefined);
    assert.equal(cache.size(), 2);
  });
});
