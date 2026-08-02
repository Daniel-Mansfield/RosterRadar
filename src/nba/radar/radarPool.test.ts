import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  RADAR_PICK_COUNT,
  RADAR_POOL,
  pickRadarCandidates,
} from "@/nba/radar/radarPool";
import { NETS_ROSTER_SEED } from "@/nba/nets/rosterSeed";
import { isEspnAthleteId } from "@/nba/headshot";

describe("RADAR_POOL", () => {
  it("has unique, positive BDL and ESPN ids", () => {
    const bdlIds = new Set(RADAR_POOL.map((c) => c.id));
    const espnIds = new Set(RADAR_POOL.map((c) => c.espnAthleteId));
    assert.equal(bdlIds.size, RADAR_POOL.length);
    assert.equal(espnIds.size, RADAR_POOL.length);
    for (const candidate of RADAR_POOL) {
      assert.ok(candidate.id > 0);
      assert.ok(isEspnAthleteId(candidate.espnAthleteId));
    }
  });

  it("never overlaps the Nets roster seed", () => {
    const netsIds = new Set(
      NETS_ROSTER_SEED.map((entry) => entry.id).filter((id) => id != null),
    );
    for (const candidate of RADAR_POOL) {
      assert.ok(
        !netsIds.has(candidate.id),
        `${candidate.firstName} ${candidate.lastName} is in the Nets seed`,
      );
      assert.notEqual(candidate.teamAbbreviation, "BKN");
    }
  });

  it("surfaces the full curated pool on each shuffle", () => {
    assert.equal(RADAR_PICK_COUNT, RADAR_POOL.length);
    assert.ok(RADAR_POOL.length >= 10);
  });
});

describe("pickRadarCandidates", () => {
  it("returns the requested count without duplicates", () => {
    const picks = pickRadarCandidates(RADAR_POOL, RADAR_PICK_COUNT);
    assert.equal(picks.length, RADAR_PICK_COUNT);
    assert.equal(new Set(picks.map((c) => c.id)).size, RADAR_PICK_COUNT);
  });

  it("can still return a smaller random subset when asked", () => {
    const picks = pickRadarCandidates(RADAR_POOL, 5);
    assert.equal(picks.length, 5);
    assert.equal(new Set(picks.map((c) => c.id)).size, 5);
  });

  it("is deterministic for a fixed random source", () => {
    let calls = 0;
    const fakeRandom = () => {
      calls += 1;
      return (calls * 37) % 100 / 100;
    };
    const a = pickRadarCandidates(RADAR_POOL, 5, fakeRandom);
    calls = 0;
    const b = pickRadarCandidates(RADAR_POOL, 5, fakeRandom);
    assert.deepEqual(
      a.map((c) => c.id),
      b.map((c) => c.id),
    );
  });

  it("caps at the pool size and tolerates zero", () => {
    assert.equal(
      pickRadarCandidates(RADAR_POOL, RADAR_POOL.length + 10).length,
      RADAR_POOL.length,
    );
    assert.equal(pickRadarCandidates(RADAR_POOL, 0).length, 0);
  });
});
