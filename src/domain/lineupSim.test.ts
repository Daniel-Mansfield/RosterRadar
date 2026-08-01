import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { RosterPlayer } from "@/domain/player";
import type { RadarCandidate } from "@/nba/radar/radarPool";
import {
  applyLineupSwap,
  buildSimBench,
  lineupIncomingFromRadar,
  parseLineupDragPayload,
  starterIdsFromPlayers,
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

describe("lineupSim", () => {
  it("applies a one-for-one swap on the target slot only", () => {
    const starters = [
      starter("PG", 1, "Egor Demin"),
      starter("SG", 2, "Nolan Traore"),
      starter("SF", 3, "Michael Porter"),
      starter("PF", 4, "Noah Clowney"),
      starter("C", 5, "Nic Claxton"),
    ];

    const next = applyLineupSwap(starters, {
      slot: "SG",
      outgoingId: 2,
      incoming: lineupIncomingFromRadar(candidate),
      source: "radar",
    });

    assert.equal(next[1]?.id, candidate.id);
    assert.equal(next[1]?.slot, "SG");
    assert.equal(next[1]?.firstName, "Anfernee");
    assert.equal(next[0]?.id, 1);
    assert.equal(next[2]?.id, 3);
  });

  it("collects resolved starter ids in roster order", () => {
    const starters = [
      starter("PG", 1, "A B"),
      { ...starter("SG", 2, "C D"), id: null },
      starter("SF", 3, "E F"),
    ];
    assert.deepEqual(starterIdsFromPlayers(starters), [1, 3]);
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

  it("parses legacy flat radar drag payloads", () => {
    const parsed = parseLineupDragPayload(JSON.stringify(candidate));
    assert.equal(parsed?.source, "radar");
    assert.equal(parsed?.incoming.id, candidate.id);
    assert.equal(parsed?.incoming.firstName, "Anfernee");
  });

  it("rejects malformed drag payloads", () => {
    assert.equal(parseLineupDragPayload("{"), null);
    assert.equal(parseLineupDragPayload(JSON.stringify({ id: "x" })), null);
  });

  it("pins the displaced starter at the front of the sim bench for radar", () => {
    const starters = [
      starter("PG", 1, "Egor Demin"),
      starter("SG", 2, "Nolan Traore"),
      starter("SF", 3, "Michael Porter"),
      starter("PF", 4, "Noah Clowney"),
      starter("C", 5, "Nic Claxton"),
    ];
    const bench = [starter("BENCH", 6, "Cam Thomas")];
    const simBench = buildSimBench(bench, starters, {
      slot: "SG",
      outgoingId: 2,
      incoming: lineupIncomingFromRadar(candidate),
      source: "radar",
    });

    assert.equal(simBench.length, 2);
    assert.equal(simBench[0]?.id, 2);
    assert.equal(simBench[0]?.slot, "BENCH");
    assert.equal(simBench[0]?.lastName, "Traore");
    assert.equal(simBench[1]?.id, 6);
  });

  it("exchanges the bench player with the displaced starter", () => {
    const starters = [
      starter("PG", 1, "Egor Demin"),
      starter("SG", 2, "Nolan Traore"),
      starter("SF", 3, "Michael Porter"),
      starter("PF", 4, "Noah Clowney"),
      starter("C", 5, "Nic Claxton"),
    ];
    const bench = [
      starter("BENCH", 6, "Cam Thomas"),
      starter("BENCH", 7, "DayRon Sharpe"),
    ];
    const simBench = buildSimBench(bench, starters, {
      slot: "SG",
      outgoingId: 2,
      incoming: {
        id: 6,
        espnAthleteId: 6,
        firstName: "Cam",
        lastName: "Thomas",
        position: "G",
        teamAbbreviation: "BKN",
      },
      source: "bench",
    });

    assert.equal(simBench.length, 2);
    assert.equal(simBench[0]?.id, 2);
    assert.equal(simBench[0]?.lastName, "Traore");
    assert.equal(simBench[1]?.id, 7);
  });
});
