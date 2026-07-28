import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PlayerSeasonLine } from "@/domain/dossier";
import {
  buildPillars,
  composeDossierFromLines,
  confidenceFromSample,
  detectRole,
  fitFromPillars,
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

  it("keeps the paint label for bigs whose assist rank is incidental (P3-10)", () => {
    // Kessler shape: playmaking ~74th pct clears the absolute creator
    // threshold, but rebounding ~99th dwarfs it — the paint read must win.
    assert.equal(
      detectRole(
        line({
          ranks: {
            points: 100, // ~80th pct
            assists: 130, // ~74th pct
            rebounds: 5, // ~99th pct
            steals: 100,
            blocks: 20,
            fg3a: 450,
            minutes: 80,
          },
        }),
      ),
      "paint_anchor",
    );
  });

  it("still calls elite dual bigs creators when playmaking stands up", () => {
    // Jokić shape: playmaking ~97th vs rebounding ~98th — within the margin.
    assert.equal(
      detectRole(
        line({
          ranks: {
            points: 50, // ~90th pct
            assists: 15, // ~97th pct
            rebounds: 10, // ~98th pct
            steals: 100,
            blocks: 100,
            fg3a: 200,
            minutes: 20,
          },
        }),
      ),
      "primary_creator",
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

  it("caps strong at conditional on thin samples, keeping the grade honest (P3-10)", () => {
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
    const fit = fitFromPillars(pillars, { thinSample: true });
    assert.equal(fit.recommendation, "conditional");
    assert.ok(fit.grade >= 65);
  });
});

describe("composeDossierFromLines", () => {
  it("marks thin-sample dossiers preliminary end to end (P3-10)", () => {
    const dossier = composeDossierFromLines({
      line: line({
        gamesPlayed: 5,
        minutes: 30.8,
        ranks: {
          points: 100,
          assists: 130,
          rebounds: 5,
          steals: 100,
          blocks: 20,
          fg3a: 450,
          minutes: 80,
        },
      }),
      games: [],
      teamAbbreviation: "LAL",
    });
    assert.equal(dossier.role.id, "paint_anchor");
    assert.equal(dossier.confidence.thinSample, true);
    assert.notEqual(dossier.fit.recommendation, "strong");
    assert.match(dossier.fit.verdict, /preliminary/i);
  });

  it("leaves full samples untempered", () => {
    const dossier = composeDossierFromLines({
      line: line(),
      games: [],
      teamAbbreviation: "BOS",
    });
    assert.equal(dossier.confidence.thinSample, false);
    assert.doesNotMatch(dossier.fit.verdict, /preliminary/i);
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
