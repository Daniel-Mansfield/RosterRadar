import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { RosterPlayer } from "@/domain/player";
import type { RadarCandidate } from "@/nba/radar/radarPool";
import {
  applyLineupSwap,
  parseRadarDragPayload,
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
      incoming: candidate,
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

  it("parses a valid radar drag payload", () => {
    const parsed = parseRadarDragPayload(JSON.stringify(candidate));
    assert.deepEqual(parsed, candidate);
  });

  it("rejects malformed drag payloads", () => {
    assert.equal(parseRadarDragPayload("{"), null);
    assert.equal(parseRadarDragPayload(JSON.stringify({ id: "x" })), null);
  });
});
