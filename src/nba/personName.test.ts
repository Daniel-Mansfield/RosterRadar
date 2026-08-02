import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizePersonName } from "@/nba/personName";

describe("normalizePersonName", () => {
  it("lowercases and strips punctuation", () => {
    assert.equal(normalizePersonName("Porter Jr."), "porterjr");
    assert.equal(normalizePersonName("Day'Ron"), "dayron");
  });

  it("folds diacritics so vendor spellings match", () => {
    // BDL stores "Nolan Traoré"; curated seed spells it "Traore".
    assert.equal(normalizePersonName("Traoré"), "traore");
  });
});
