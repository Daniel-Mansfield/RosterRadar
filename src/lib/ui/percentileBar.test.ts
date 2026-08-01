import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PERCENTILE_BAR_POOR,
  PERCENTILE_BAR_STRONG,
  percentileBarTone,
} from "@/lib/ui/percentileBar";
import {
  TEAM_GAP_THRESHOLD,
  TEAM_STRENGTH_THRESHOLD,
} from "@/scoring/composeTeamFit";

describe("percentileBarTone", () => {
  it("aligns strong/poor cutoffs with lineup callout thresholds", () => {
    assert.equal(PERCENTILE_BAR_STRONG, TEAM_STRENGTH_THRESHOLD);
    assert.equal(PERCENTILE_BAR_POOR, TEAM_GAP_THRESHOLD);
  });

  it("classifies extremes and mid-band", () => {
    assert.equal(percentileBarTone(70), "strong");
    assert.equal(percentileBarTone(100), "strong");
    assert.equal(percentileBarTone(45), "poor");
    assert.equal(percentileBarTone(0), "poor");
    assert.equal(percentileBarTone(46), "mid");
    assert.equal(percentileBarTone(69), "mid");
  });
});
