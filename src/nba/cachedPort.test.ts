import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PlayerGameLine, PlayerSeasonLine } from "@/domain/dossier";
import type { NetsRoster, PlayerSummary } from "@/domain/player";
import { createTtlCache } from "@/lib/cache/ttlCache";
import { createCachedNbaPort } from "@/nba/cachedPort";
import type { NbaStatsPort } from "@/nba/port";

function mockPort(counts: {
  search: number;
  season: number;
  games: number;
}): NbaStatsPort {
  const player: PlayerSummary = {
    id: 1,
    firstName: "Test",
    lastName: "Player",
    position: "G",
    teamAbbreviation: "BOS",
  };

  return {
    async searchPlayers(): Promise<PlayerSummary[]> {
      counts.search += 1;
      return [player];
    },
    async getNetsRoster(): Promise<NetsRoster> {
      return {
        teamId: 1,
        teamAbbreviation: "BKN",
        teamName: "Brooklyn Nets",
        starters: [],
        bench: [],
      };
    },
    async getPlayerSeasonLine(): Promise<PlayerSeasonLine | null> {
      counts.season += 1;
      return null;
    },
    async getPlayerRecentGames(): Promise<PlayerGameLine[]> {
      counts.games += 1;
      return [];
    },
  };
}

describe("createCachedNbaPort", () => {
  it("caches search by normalized query (case/trim)", async () => {
    const counts = { search: 0, season: 0, games: 0 };
    const port = createCachedNbaPort(mockPort(counts), {
      cache: createTtlCache({ ttlMs: 60_000 }),
    });

    await port.searchPlayers({ query: "  Luka  ", excludeNets: true });
    await port.searchPlayers({ query: "luka", excludeNets: true });
    assert.equal(counts.search, 1);
  });

  it("keeps excludeNets variants on separate keys", async () => {
    const counts = { search: 0, season: 0, games: 0 };
    const port = createCachedNbaPort(mockPort(counts), {
      cache: createTtlCache({ ttlMs: 60_000 }),
    });

    await port.searchPlayers({ query: "luka", excludeNets: true });
    await port.searchPlayers({ query: "luka", excludeNets: false });
    assert.equal(counts.search, 2);
  });

  it("caches null season lines", async () => {
    const counts = { search: 0, season: 0, games: 0 };
    const port = createCachedNbaPort(mockPort(counts), {
      cache: createTtlCache({ ttlMs: 60_000 }),
    });

    assert.equal(await port.getPlayerSeasonLine(1, 2025), null);
    assert.equal(await port.getPlayerSeasonLine(1, 2025), null);
    assert.equal(counts.season, 1);
  });
});
