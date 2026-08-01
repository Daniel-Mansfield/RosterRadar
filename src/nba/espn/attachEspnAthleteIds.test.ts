import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PlayerSummary } from "@/domain/player";
import { createTtlCache } from "@/lib/cache/ttlCache";
import { attachEspnAthleteIds } from "@/nba/espn/attachEspnAthleteIds";

function summary(id: number): PlayerSummary {
  return {
    id,
    firstName: "LeBron",
    lastName: "James",
    position: "F",
    teamAbbreviation: "LAL",
    espnAthleteId: null,
  };
}

describe("attachEspnAthleteIds", () => {
  it("does not cache null resolves so a later attempt can succeed", async () => {
    const cache = createTtlCache({ ttlMs: 60_000, maxEntries: 16 });
    let calls = 0;

    const first = await attachEspnAthleteIds([summary(237)], {
      cache,
      resolve: async () => {
        calls += 1;
        return null;
      },
    });
    assert.equal(first[0]?.espnAthleteId, null);
    assert.equal(calls, 1);

    const second = await attachEspnAthleteIds([summary(237)], {
      cache,
      resolve: async () => {
        calls += 1;
        return 1966;
      },
    });
    assert.equal(second[0]?.espnAthleteId, 1966);
    assert.equal(calls, 2);
  });

  it("caches successful ESPN ids across calls", async () => {
    const cache = createTtlCache({ ttlMs: 60_000, maxEntries: 16 });
    let calls = 0;

    await attachEspnAthleteIds([summary(237)], {
      cache,
      resolve: async () => {
        calls += 1;
        return 1966;
      },
    });
    const again = await attachEspnAthleteIds([summary(237)], {
      cache,
      resolve: async () => {
        calls += 1;
        return 1966;
      },
    });

    assert.equal(again[0]?.espnAthleteId, 1966);
    assert.equal(calls, 1);
  });
});
