import type { CourtSlot, RosterPlayer } from "@/domain/player";
import type { RadarCandidate } from "@/nba/radar/radarPool";

/** Starter slots that can receive a Radar swap. */
export type StarterSlot = Exclude<CourtSlot, "BENCH">;

/**
 * One Radar candidate in for one starter out — client-side hypothetical only.
 * Not a trade engine (no salary, packages, or synergy).
 */
export type LineupSwap = {
  slot: StarterSlot;
  /** BALLDONTLIE id of the displaced starter. */
  outgoingId: number;
  incoming: RadarCandidate;
};

export type LineupSimState =
  | { status: "idle" }
  | { status: "simulating"; swap: LineupSwap };

/** MIME type for HTML5 drag payloads from On the Radar. */
export const RADAR_DRAG_MIME = "application/x-rosterradar-radar-candidate";

export function isStarterSlot(slot: CourtSlot): slot is StarterSlot {
  return slot !== "BENCH";
}

/** Resolve BALLDONTLIE ids for a starting five (skips unresolved seeds). */
export function starterIdsFromPlayers(starters: RosterPlayer[]): number[] {
  return starters
    .map((player) => player.id)
    .filter((id): id is number => id != null);
}

/** Replace the starter in `swap.slot` with the incoming Radar candidate. */
export function applyLineupSwap(
  starters: RosterPlayer[],
  swap: LineupSwap,
): RosterPlayer[] {
  return starters.map((player) => {
    if (player.slot !== swap.slot) {
      return player;
    }
    return {
      id: swap.incoming.id,
      espnAthleteId: swap.incoming.espnAthleteId,
      firstName: swap.incoming.firstName,
      lastName: swap.incoming.lastName,
      position: swap.incoming.position,
      teamAbbreviation: swap.incoming.teamAbbreviation,
      slot: swap.slot,
    };
  });
}

export function parseRadarDragPayload(raw: string): RadarCandidate | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("id" in parsed) ||
      typeof parsed.id !== "number" ||
      !("firstName" in parsed) ||
      typeof parsed.firstName !== "string" ||
      !("lastName" in parsed) ||
      typeof parsed.lastName !== "string" ||
      !("position" in parsed) ||
      typeof parsed.position !== "string" ||
      !("teamAbbreviation" in parsed) ||
      typeof parsed.teamAbbreviation !== "string" ||
      !("espnAthleteId" in parsed) ||
      typeof parsed.espnAthleteId !== "number"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      espnAthleteId: parsed.espnAthleteId,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      position: parsed.position,
      teamAbbreviation: parsed.teamAbbreviation,
      angle:
        "angle" in parsed && typeof parsed.angle === "string"
          ? parsed.angle
          : "",
    };
  } catch {
    return null;
  }
}
