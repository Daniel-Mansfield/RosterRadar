import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NETS_SEED_NAME_KEYS,
  normalizePersonName,
} from "@/nba/nets/rosterSeed";

describe("normalizePersonName", () => {
  it("lowercases and strips punctuation", () => {
    assert.equal(normalizePersonName("Porter Jr."), "porterjr");
    assert.equal(normalizePersonName("Day'Ron"), "dayron");
  });

  it("folds diacritics so vendor spellings match the seed", () => {
    // BDL stores "Nolan Traoré"; our seed spells it "Traore".
    assert.equal(normalizePersonName("Traoré"), "traore");
    assert.ok(NETS_SEED_NAME_KEYS.has("nolan|traore"));
  });
});
