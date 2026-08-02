import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { teamSubtitleMatches } from "@/nba/espn/teamHints";

describe("teamSubtitleMatches", () => {
  it("matches known abbreviation hints", () => {
    assert.equal(teamSubtitleMatches("Los Angeles Lakers", "LAL"), true);
    assert.equal(teamSubtitleMatches("Philadelphia 76ers", "PHI"), true);
    assert.equal(teamSubtitleMatches("Boston Celtics", "LAL"), false);
  });

  it("is permissive when team or subtitle is missing", () => {
    assert.equal(teamSubtitleMatches("Lakers", null), true);
    assert.equal(teamSubtitleMatches(null, "LAL"), true);
    assert.equal(teamSubtitleMatches("", "XYZ"), true);
  });
});
