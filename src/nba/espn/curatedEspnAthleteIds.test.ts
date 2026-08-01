import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { curatedEspnAthleteId } from "@/nba/espn/curatedEspnAthleteIds";
import { RADAR_POOL } from "@/nba/radar/radarPool";

describe("curatedEspnAthleteId", () => {
  it("returns Radar-pool ESPN ids by BDL id", () => {
    const first = RADAR_POOL[0];
    assert.ok(first);
    assert.equal(curatedEspnAthleteId(first.id), first.espnAthleteId);
  });

  it("returns null for unknown BDL ids", () => {
    assert.equal(curatedEspnAthleteId(-1), null);
  });
});
