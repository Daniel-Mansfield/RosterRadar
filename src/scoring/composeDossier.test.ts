import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PlayerSeasonLine } from "@/domain/dossier";
import {
  buildPillars,
  confidenceFromSample,
  detectRole,
  fitFromPillars,
  parseMinutes,
  percentileFromRank,
} from "@/scoring/composeDossier";

function line(overrides: Partial<PlayerSeasonLine> = {}): PlayerSeasonLine {
  return {
    playerId: 1,
    firstName: "Test",
    lastName: "Player",
    position: "G",
    teamAbbreviation: "BOS",
    season: 2025,
    gamesPlayed: 50,
    minutes: 32,
    points: 22,
    assists: 6,
    rebounds: 4,
    steals: 1,
    blocks: 0.4,
    turnovers: 2,
    fga: 18,
    fg3a: 7,
    fg3m: 2.5,
    fg3Pct: 0.35,
    ranks: {
      points: 40,
      assists: 30,
      rebounds: 200,
      steals: 100,
      blocks: 250,
      fg3a: 50,
      minutes: 60,
    },
    ...overrides,
  };
}

describe("percentileFromRank", () => {
  it("maps rank 1 near the top of the pool", () => {
    assert.equal(percentileFromRank(1, 500), 99);
  });

  it("maps mid ranks near 50", () => {
    assert.equal(percentileFromRank(250, 500), 50);
  });

  it("defaults null ranks to 50", () => {
    assert.equal(percentileFromRank(null), 50);
  });
});

describe("parseMinutes", () => {
  it("parses clock strings", () => {
    assert.ok(Math.abs(parseMinutes("32:30") - 32.5) < 0.001);
  });

  it("treats 00 as zero", () => {
    assert.equal(parseMinutes("00"), 0);
  });
});

describe("detectRole", () => {
  it("labels high assist + scoring creators", () => {
    assert.equal(
      detectRole(
        line({
          ranks: {
            points: 40,
            assists: 20,
            rebounds: 300,
            steals: 200,
            blocks: 300,
            fg3a: 100,
            minutes: 40,
          },
        }),
      ),
      "primary_creator",
    );
  });

  it("labels high-rebound paint anchors", () => {
    assert.equal(
      detectRole(
        line({
          ranks: {
            points: 80,
            assists: 300,
            rebounds: 15,
            steals: 200,
            blocks: 40,
            fg3a: 400,
            minutes: 50,
          },
        }),
      ),
      "paint_anchor",
    );
  });
});

describe("fitFromPillars", () => {
  it("grades strong when pillars are high", () => {
    const pillars = buildPillars(
      line({
        ranks: {
          points: 20,
          assists: 20,
          rebounds: 20,
          steals: 20,
          blocks: 20,
          fg3a: 20,
          minutes: 20,
        },
      }),
    );
    const fit = fitFromPillars(pillars);
    assert.equal(fit.recommendation, "strong");
    assert.ok(fit.grade >= 65);
  });
});

describe("confidenceFromSample", () => {
  it("returns low for thin samples", () => {
    assert.equal(confidenceFromSample(5, 8), "low");
  });

  it("returns high for full samples", () => {
    assert.equal(confidenceFromSample(50, 28), "high");
  });
});
