import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Dossier, PillarId } from "@/domain/dossier";
import { ordinal } from "@/scoring/composeDossier";
import { LINEUP_SIZE } from "@/domain/teamFit";
import {
  TEAM_FIT_SCORING_VERSION,
  composeTeamFit,
} from "@/scoring/composeTeamFit";

const PILLAR_ORDER: { id: PillarId; label: string }[] = [
  { id: "scoring", label: "Scoring" },
  { id: "playmaking", label: "Playmaking" },
  { id: "rebounding", label: "Rebounding" },
  { id: "spacing", label: "Spacing" },
  { id: "disruption", label: "Disruption" },
  { id: "workload", label: "Workload" },
];

type DossierOptions = {
  id?: number;
  firstName?: string;
  lastName?: string;
  season?: number;
  thinSample?: boolean;
  /** Percentile per pillar; unspecified pillars default to 50. */
  pillars?: Partial<Record<PillarId, number>>;
};

function makeDossier(options: DossierOptions = {}): Dossier {
  const {
    id = 1,
    firstName = "Test",
    lastName = `Player${id}`,
    season = 2025,
    thinSample = false,
    pillars = {},
  } = options;

  return {
    player: {
      id,
      firstName,
      lastName,
      position: "G",
      teamAbbreviation: "BKN",
    },
    season,
    role: { id: "wing_scorer", label: "Wing scorer" },
    fit: { grade: 50, recommendation: "conditional", verdict: "test" },
    confidence: {
      level: thinSample ? "low" : "high",
      thinSample,
      gamesPlayed: thinSample ? 5 : 50,
      minutesPerGame: 30,
    },
    pillars: PILLAR_ORDER.map(({ id: pillarId, label }) => ({
      id: pillarId,
      label,
      percentile: pillars[pillarId] ?? 50,
      raw: 0,
      unit: "x",
    })),
    callouts: [],
    evidence: [],
    methodology: {
      scoringVersion: "test",
      peerPoolSize: 500,
      minMinutesForGame: 5,
      notes: [],
    },
  };
}

describe("ordinal", () => {
  it("uses the correct English suffixes", () => {
    assert.equal(ordinal(71), "71st");
    assert.equal(ordinal(82), "82nd");
    assert.equal(ordinal(93), "93rd");
    assert.equal(ordinal(50), "50th");
    // Teens are always "th", including 11–13.
    assert.equal(ordinal(11), "11th");
    assert.equal(ordinal(12), "12th");
    assert.equal(ordinal(13), "13th");
  });
});

describe("composeTeamFit", () => {
  it("averages each pillar across the starters", () => {
    const teamFit = composeTeamFit([
      makeDossier({ id: 1, pillars: { scoring: 90 } }),
      makeDossier({ id: 2, pillars: { scoring: 70 } }),
      makeDossier({ id: 3, pillars: { scoring: 50 } }),
      makeDossier({ id: 4, pillars: { scoring: 30 } }),
      makeDossier({ id: 5, pillars: { scoring: 10 } }),
    ]);

    const scoring = teamFit.pillars.find((p) => p.id === "scoring");
    assert.equal(scoring?.percentile, 50);
    // Unspecified pillars are all 50 → their averages stay 50.
    const playmaking = teamFit.pillars.find((p) => p.id === "playmaking");
    assert.equal(playmaking?.percentile, 50);
  });

  it("keeps the six pillars in dossier order", () => {
    const teamFit = composeTeamFit([makeDossier()]);
    assert.deepEqual(
      teamFit.pillars.map((p) => p.id),
      PILLAR_ORDER.map((p) => p.id),
    );
  });

  it("grades the lineup as the mean of the six team pillars", () => {
    // All pillars 80 for every starter → grade 80 and a strong read.
    const high = Object.fromEntries(
      PILLAR_ORDER.map((p) => [p.id, 80]),
    ) as Record<PillarId, number>;
    const teamFit = composeTeamFit([
      makeDossier({ id: 1, pillars: high }),
      makeDossier({ id: 2, pillars: high }),
    ]);

    assert.equal(teamFit.grade, 80);
    assert.equal(teamFit.recommendation, "strong");
  });

  it("caps the recommendation at conditional when any starter is a thin sample", () => {
    const high = Object.fromEntries(
      PILLAR_ORDER.map((p) => [p.id, 80]),
    ) as Record<PillarId, number>;
    const teamFit = composeTeamFit([
      makeDossier({ id: 1, pillars: high }),
      makeDossier({
        id: 2,
        firstName: "Thin",
        lastName: "Sample",
        pillars: high,
        thinSample: true,
      }),
    ]);

    assert.equal(teamFit.grade, 80);
    assert.equal(teamFit.recommendation, "conditional");
    assert.equal(teamFit.confidence.anyThinSample, true);
    assert.deepEqual(teamFit.confidence.thinSampleNames, ["Thin Sample"]);
  });

  it("flags strengths with the leading starter named", () => {
    const teamFit = composeTeamFit([
      makeDossier({
        id: 1,
        firstName: "Lead",
        lastName: "Guard",
        pillars: { scoring: 95 },
      }),
      makeDossier({ id: 2, pillars: { scoring: 65 } }),
    ]);

    const strengths = teamFit.callouts.filter((c) => c.kind === "strength");
    assert.equal(strengths.length, 1);
    assert.match(strengths[0]?.text ?? "", /Scoring is a lineup strength/);
    assert.match(strengths[0]?.text ?? "", /led by Lead Guard \(95th\)/);
  });

  it("flags gaps with the ceiling starter percentile", () => {
    const teamFit = composeTeamFit([
      makeDossier({ id: 1, pillars: { playmaking: 40 } }),
      makeDossier({ id: 2, pillars: { playmaking: 20 } }),
    ]);

    const gaps = teamFit.callouts.filter((c) => c.kind === "risk");
    assert.equal(gaps.length, 1);
    assert.match(gaps[0]?.text ?? "", /Playmaking is a lineup gap/);
    assert.match(gaps[0]?.text ?? "", /no starter tops the 40th/);
  });

  it("caps callouts at two strengths and two gaps, most extreme first", () => {
    const teamFit = composeTeamFit([
      makeDossier({
        id: 1,
        pillars: {
          scoring: 90,
          playmaking: 80,
          rebounding: 75,
          spacing: 10,
          disruption: 20,
          workload: 30,
        },
      }),
    ]);

    const strengths = teamFit.callouts.filter((c) => c.kind === "strength");
    const gaps = teamFit.callouts.filter((c) => c.kind === "risk");
    assert.equal(strengths.length, 2);
    assert.equal(gaps.length, 2);
    assert.match(strengths[0]?.text ?? "", /^Scoring/);
    assert.match(strengths[1]?.text ?? "", /^Playmaking/);
    assert.match(gaps[0]?.text ?? "", /^Spacing/);
    assert.match(gaps[1]?.text ?? "", /^Disruption/);
  });

  it("emits no callouts for a balanced lineup", () => {
    const teamFit = composeTeamFit([makeDossier({ id: 1 })]);
    assert.deepEqual(teamFit.callouts, []);
  });

  it("reports the latest season and notes mixed-season samples", () => {
    const mixed = composeTeamFit([
      makeDossier({ id: 1, season: 2025 }),
      makeDossier({ id: 2, season: 2024 }),
    ]);
    assert.equal(mixed.season, 2025);
    assert.ok(
      mixed.methodology.notes.some((n) => n.includes("prior season")),
    );

    const uniform = composeTeamFit([
      makeDossier({ id: 1, season: 2025 }),
      makeDossier({ id: 2, season: 2025 }),
    ]);
    assert.ok(
      !uniform.methodology.notes.some((n) => n.includes("prior season")),
    );
  });

  it("lists the starters in input order with thin-sample flags", () => {
    const teamFit = composeTeamFit([
      makeDossier({ id: 7, firstName: "A", lastName: "One" }),
      makeDossier({
        id: 8,
        firstName: "B",
        lastName: "Two",
        thinSample: true,
      }),
    ]);

    assert.deepEqual(
      teamFit.starters.map((s) => [s.playerId, s.thinSample]),
      [
        [7, false],
        [8, true],
      ],
    );
  });

  it("stamps the team-fit scoring version", () => {
    const teamFit = composeTeamFit([makeDossier()]);
    assert.equal(
      teamFit.methodology.scoringVersion,
      TEAM_FIT_SCORING_VERSION,
    );
  });

  it("rejects empty and oversized lineups", () => {
    assert.throws(() => composeTeamFit([]), /requires 1/);
    assert.throws(
      () =>
        composeTeamFit(
          Array.from({ length: LINEUP_SIZE + 1 }, (_, i) =>
            makeDossier({ id: i + 1 }),
          ),
        ),
      /requires 1/,
    );
  });
});
