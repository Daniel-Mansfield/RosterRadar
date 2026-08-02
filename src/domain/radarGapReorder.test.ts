import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TeamFit } from "@/domain/teamFit";
import {
  isHardLineupGap,
  primaryLineupNeedPillar,
  reorderByPillarScores,
} from "@/domain/radarGapReorder";

function teamFit(pillars: TeamFit["pillars"]): TeamFit {
  return {
    season: 2025,
    starters: [],
    grade: 50,
    recommendation: "conditional",
    pillars,
    callouts: [],
    confidence: { anyThinSample: false, thinSampleNames: [] },
    methodology: { scoringVersion: "test", notes: [] },
  };
}

describe("primaryLineupNeedPillar", () => {
  it("picks the weakest hard gap when present", () => {
    const need = primaryLineupNeedPillar(
      teamFit([
        { id: "scoring", label: "Scoring", percentile: 72 },
        { id: "disruption", label: "Disruption", percentile: 40 },
        { id: "rebounding", label: "Rebounding", percentile: 38 },
        { id: "playmaking", label: "Playmaking", percentile: 60 },
        { id: "spacing", label: "Spacing", percentile: 55 },
        { id: "workload", label: "Workload", percentile: 58 },
      ]),
    );
    assert.equal(need?.id, "rebounding");
    assert.equal(need && isHardLineupGap(need), true);
  });

  it("falls back to the softest pillar when there is no hard gap", () => {
    const need = primaryLineupNeedPillar(
      teamFit([
        { id: "scoring", label: "Scoring", percentile: 72 },
        { id: "disruption", label: "Disruption", percentile: 51 },
        { id: "rebounding", label: "Rebounding", percentile: 49 },
        { id: "playmaking", label: "Playmaking", percentile: 60 },
        { id: "spacing", label: "Spacing", percentile: 55 },
        { id: "workload", label: "Workload", percentile: 58 },
      ]),
    );
    assert.equal(need?.id, "rebounding");
    assert.equal(need && isHardLineupGap(need), false);
  });
});

describe("reorderByPillarScores", () => {
  it("orders high scores first and sinks missing scores", () => {
    const ordered = reorderByPillarScores(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      new Map([
        [1, 40],
        [2, null],
        [3, 80],
      ]),
    );
    assert.deepEqual(
      ordered.map((c) => c.id),
      [3, 1, 2],
    );
  });

  it("keeps input order on ties", () => {
    const ordered = reorderByPillarScores(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      new Map([
        [1, 70],
        [2, 70],
        [3, 50],
      ]),
    );
    assert.deepEqual(
      ordered.map((c) => c.id),
      [1, 2, 3],
    );
  });
});
