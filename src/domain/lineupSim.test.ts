import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { RosterPlayer } from "@/domain/player";
import type { RadarCandidate } from "@/nba/radar/radarPool";
import {
  applyLineupOverrides,
  applyLineupSwap,
  buildSimBench,
  displacedRealStarters,
  isIncomingOnSimFive,
  lineupIncomingFromRadar,
  lineupIncomingFromSummary,
  lineupSimSummaryLines,
  outPinnedRealStarters,
  parseLineupDragPayload,
  starterIdsFromPlayers,
  upsertLineupOverride,
} from "@/domain/lineupSim";

const candidate: RadarCandidate = {
  id: 419,
  espnAthleteId: 4351851,
  firstName: "Anfernee",
  lastName: "Simons",
  position: "G",
  teamAbbreviation: "PHI",
  angle: "Shot creation",
};

const whitmore: RadarCandidate = {
  id: 520,
  espnAthleteId: 4432176,
  firstName: "Cam",
  lastName: "Whitmore",
  position: "F",
  teamAbbreviation: "WAS",
  angle: "Wing swing",
};

function starter(
  slot: RosterPlayer["slot"],
  id: number,
  name: string,
): RosterPlayer {
  const [firstName, lastName] = name.split(" ");
  return {
    id,
    espnAthleteId: id,
    firstName: firstName ?? "A",
    lastName: lastName ?? "B",
    position: "G",
    teamAbbreviation: "BKN",
    slot,
  };
}

const realFive = [
  starter("PG", 1, "Egor Demin"),
  starter("SG", 2, "Nolan Traore"),
  starter("SF", 3, "Michael Porter"),
  starter("PF", 4, "Noah Clowney"),
  starter("C", 5, "Nic Claxton"),
];

describe("lineupSim", () => {
  it("applies a one-for-one swap on the target slot only", () => {
    const next = applyLineupSwap(realFive, {
      slot: "SG",
      incoming: lineupIncomingFromRadar(candidate),
      source: "acquisition",
    });

    assert.equal(next[1]?.id, candidate.id);
    assert.equal(next[1]?.slot, "SG");
    assert.equal(next[1]?.firstName, "Anfernee");
    assert.equal(next[0]?.id, 1);
    assert.equal(next[2]?.id, 3);
  });

  it("accumulates overrides across multiple slots", () => {
    const overrides = [
      {
        slot: "SG" as const,
        incoming: lineupIncomingFromRadar(candidate),
        source: "acquisition" as const,
      },
      {
        slot: "PF" as const,
        incoming: lineupIncomingFromRadar(whitmore),
        source: "acquisition" as const,
      },
    ];
    const next = applyLineupOverrides(realFive, overrides);
    assert.equal(next[1]?.id, candidate.id);
    assert.equal(next[3]?.id, whitmore.id);
    assert.equal(next[0]?.id, 1);
  });

  it("overwrites an existing slot override when shopping the same hole", () => {
    const first = upsertLineupOverride(
      [],
      {
        slot: "PF",
        incoming: lineupIncomingFromRadar(candidate),
        source: "acquisition",
      },
      realFive,
    );
    const second = upsertLineupOverride(
      first,
      {
        slot: "PF",
        incoming: lineupIncomingFromRadar(whitmore),
        source: "acquisition",
      },
      realFive,
    );
    assert.equal(second.length, 1);
    assert.equal(second[0]?.incoming.id, whitmore.id);
    const next = applyLineupOverrides(realFive, second);
    assert.equal(next[3]?.id, whitmore.id);
  });

  it("clears a home-slot return and can idle the sim", () => {
    const withHerbert = upsertLineupOverride(
      [],
      {
        slot: "PF",
        incoming: lineupIncomingFromRadar(candidate),
        source: "acquisition",
      },
      realFive,
    );
    const restored = upsertLineupOverride(
      withHerbert,
      {
        slot: "PF",
        incoming: {
          id: 4,
          espnAthleteId: 4,
          firstName: "Noah",
          lastName: "Clowney",
          position: "F",
          teamAbbreviation: "BKN",
        },
        source: "return",
      },
      realFive,
    );
    assert.deepEqual(restored, []);
  });

  it("returns an Out starter onto a different slot", () => {
    const withHerbert = upsertLineupOverride(
      [],
      {
        slot: "PF",
        incoming: lineupIncomingFromRadar(candidate),
        source: "acquisition",
      },
      realFive,
    );
    const moved = upsertLineupOverride(
      withHerbert,
      {
        slot: "SF",
        incoming: {
          id: 4,
          espnAthleteId: 4,
          firstName: "Noah",
          lastName: "Clowney",
          position: "F",
          teamAbbreviation: "BKN",
        },
        source: "return",
      },
      realFive,
    );
    assert.equal(moved.length, 2);
    const next = applyLineupOverrides(realFive, moved);
    assert.equal(next[3]?.id, candidate.id);
    assert.equal(next[2]?.id, 4);
    const outs = displacedRealStarters(realFive, next);
    assert.deepEqual(
      outs.map((p) => p.id),
      [3],
    );
  });

  it("blocks detecting someone already on the simulated five", () => {
    const display = applyLineupOverrides(realFive, [
      {
        slot: "SG",
        incoming: lineupIncomingFromRadar(candidate),
        source: "acquisition",
      },
    ]);
    assert.equal(isIncomingOnSimFive(display, candidate.id), true);
    assert.equal(isIncomingOnSimFive(display, 6), false);
  });

  it("builds stacked summary lines in slot order", () => {
    const lines = lineupSimSummaryLines(realFive, [
      {
        slot: "PF",
        incoming: lineupIncomingFromRadar(whitmore),
        source: "acquisition",
      },
      {
        slot: "SG",
        incoming: lineupIncomingFromRadar(candidate),
        source: "acquisition",
      },
    ]);
    assert.deepEqual(lines, [
      {
        slot: "SG",
        text: "Anfernee Simons in for Nolan Traore (SG)",
      },
      {
        slot: "PF",
        text: "Cam Whitmore in for Noah Clowney (PF)",
      },
    ]);
  });

  it("collects resolved starter ids in roster order", () => {
    const starters = [
      starter("PG", 1, "A B"),
      { ...starter("SG", 2, "C D"), id: null },
      starter("SF", 3, "E F"),
    ];
    assert.deepEqual(starterIdsFromPlayers(starters), [1, 3]);
  });

  it("maps a player summary into lineup incoming", () => {
    const incoming = lineupIncomingFromSummary({
      id: 237,
      firstName: "LeBron",
      lastName: "James",
      position: "F",
      teamAbbreviation: "LAL",
      espnAthleteId: 1966,
    });
    assert.equal(incoming.id, 237);
    assert.equal(incoming.espnAthleteId, 1966);
    assert.equal(incoming.lastName, "James");
  });

  it("parses a lineup drag payload", () => {
    const payload = {
      source: "bench" as const,
      incoming: {
        id: 6,
        espnAthleteId: 6,
        firstName: "Cam",
        lastName: "Thomas",
        position: "G",
        teamAbbreviation: "BKN",
      },
    };
    const parsed = parseLineupDragPayload(JSON.stringify(payload));
    assert.deepEqual(parsed, payload);
  });

  it("parses return drag payloads", () => {
    const parsed = parseLineupDragPayload(
      JSON.stringify({
        source: "return",
        incoming: {
          id: 4,
          espnAthleteId: 4,
          firstName: "Noah",
          lastName: "Clowney",
          position: "F",
          teamAbbreviation: "BKN",
        },
      }),
    );
    assert.equal(parsed?.source, "return");
    assert.equal(parsed?.incoming.id, 4);
  });

  it("parses legacy flat radar drag payloads as acquisition", () => {
    const parsed = parseLineupDragPayload(JSON.stringify(candidate));
    assert.equal(parsed?.source, "acquisition");
    assert.equal(parsed?.incoming.id, candidate.id);
    assert.equal(parsed?.incoming.firstName, "Anfernee");
  });

  it("normalizes legacy source radar to acquisition", () => {
    const parsed = parseLineupDragPayload(
      JSON.stringify({
        source: "radar",
        incoming: lineupIncomingFromRadar(candidate),
      }),
    );
    assert.equal(parsed?.source, "acquisition");
    assert.equal(parsed?.incoming.id, candidate.id);
  });

  it("rejects malformed drag payloads", () => {
    assert.equal(parseLineupDragPayload("{"), null);
    assert.equal(parseLineupDragPayload(JSON.stringify({ id: "x" })), null);
  });

  it("pins the displaced starter at the front of the sim bench for acquisition", () => {
    const bench = [starter("BENCH", 6, "Cam Thomas")];
    const simBench = buildSimBench(bench, realFive, [
      {
        slot: "SG",
        incoming: lineupIncomingFromRadar(candidate),
        source: "acquisition",
      },
    ]);

    assert.equal(simBench.length, 2);
    assert.equal(simBench[0]?.id, 2);
    assert.equal(simBench[0]?.slot, "BENCH");
    assert.equal(simBench[0]?.lastName, "Traore");
    assert.equal(simBench[1]?.id, 6);
  });

  it("exchanges the bench player with the displaced starter", () => {
    const bench = [
      starter("BENCH", 6, "Cam Thomas"),
      starter("BENCH", 7, "DayRon Sharpe"),
    ];
    const simBench = buildSimBench(bench, realFive, [
      {
        slot: "SG",
        incoming: {
          id: 6,
          espnAthleteId: 6,
          firstName: "Cam",
          lastName: "Thomas",
          position: "G",
          teamAbbreviation: "BKN",
        },
        source: "bench",
      },
    ]);

    assert.equal(simBench.length, 2);
    assert.equal(simBench[0]?.id, 2);
    assert.equal(simBench[0]?.lastName, "Traore");
    assert.equal(simBench[1]?.id, 7);
  });

  it("keeps multiple Out pins when stacking acquisition swaps", () => {
    const bench = [starter("BENCH", 6, "Cam Thomas")];
    const overrides = [
      {
        slot: "SG" as const,
        incoming: lineupIncomingFromRadar(candidate),
        source: "acquisition" as const,
      },
      {
        slot: "PF" as const,
        incoming: lineupIncomingFromRadar(whitmore),
        source: "acquisition" as const,
      },
    ];
    const simBench = buildSimBench(bench, realFive, overrides);
    assert.deepEqual(
      simBench.map((p) => p.id),
      [2, 4, 6],
    );
  });

  it("does not Out-badge a bench true-exchange displacement", () => {
    const overrides = [
      {
        slot: "SG" as const,
        incoming: {
          id: 6,
          espnAthleteId: 6,
          firstName: "Cam",
          lastName: "Thomas",
          position: "G",
          teamAbbreviation: "BKN",
        },
        source: "bench" as const,
      },
    ];
    const display = applyLineupOverrides(realFive, overrides);
    const outs = outPinnedRealStarters(realFive, display, overrides);
    assert.deepEqual(outs.map((p) => p.id), []);
    assert.deepEqual(
      displacedRealStarters(realFive, display).map((p) => p.id),
      [2],
    );
  });

  it("Out-badges acquisition and return displacements only", () => {
    const overrides = [
      {
        slot: "PF" as const,
        incoming: lineupIncomingFromRadar(whitmore),
        source: "acquisition" as const,
      },
      {
        slot: "SG" as const,
        incoming: {
          id: 6,
          espnAthleteId: 6,
          firstName: "Cam",
          lastName: "Thomas",
          position: "G",
          teamAbbreviation: "BKN",
        },
        source: "bench" as const,
      },
    ];
    const display = applyLineupOverrides(realFive, overrides);
    assert.deepEqual(
      outPinnedRealStarters(realFive, display, overrides).map((p) => p.id),
      [4],
    );
  });

  it("Out-badges a starter displaced when an Out pin returns to another slot", () => {
    const overrides = [
      {
        slot: "PF" as const,
        incoming: lineupIncomingFromRadar(whitmore),
        source: "acquisition" as const,
      },
      {
        slot: "SF" as const,
        incoming: {
          id: 4,
          espnAthleteId: 4,
          firstName: "Noah",
          lastName: "Clowney",
          position: "F",
          teamAbbreviation: "BKN",
        },
        source: "return" as const,
      },
    ];
    const display = applyLineupOverrides(realFive, overrides);
    assert.deepEqual(
      outPinnedRealStarters(realFive, display, overrides).map((p) => p.id),
      [3],
    );
  });
});
