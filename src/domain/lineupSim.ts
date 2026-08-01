import type { CourtSlot, RosterPlayer } from "@/domain/player";
import type { RadarCandidate } from "@/nba/radar/radarPool";

/** Starter slots that can receive a lineup swap. */
export type StarterSlot = Exclude<CourtSlot, "BENCH">;

/** Shared shape for Radar or bench players entering a starter slot. */
export type LineupIncoming = {
  id: number;
  espnAthleteId: number | null;
  firstName: string;
  lastName: string;
  position: string | null;
  teamAbbreviation: string | null;
};

export type LineupSwapSource = "radar" | "bench";

/**
 * One player in for one starter out — client-side hypothetical only.
 * Not a trade engine (no salary, packages, or synergy).
 *
 * - `radar`: acquisition candidate in; displaced starter pinned on the bench.
 * - `bench`: true exchange — bench player starts; displaced starter takes that bench spot.
 */
export type LineupSwap = {
  slot: StarterSlot;
  /** BALLDONTLIE id of the displaced starter. */
  outgoingId: number;
  incoming: LineupIncoming;
  source: LineupSwapSource;
};

export type LineupSimState =
  | { status: "idle" }
  | { status: "simulating"; swap: LineupSwap };

/** MIME type for HTML5 drag payloads (Radar or bench → starter). */
export const LINEUP_DRAG_MIME = "application/x-rosterradar-lineup-incoming";

/** @deprecated Use LINEUP_DRAG_MIME — kept so in-flight drops still parse. */
export const RADAR_DRAG_MIME = LINEUP_DRAG_MIME;

export function isStarterSlot(slot: CourtSlot): slot is StarterSlot {
  return slot !== "BENCH";
}

export function lineupIncomingFromRadar(
  candidate: RadarCandidate,
): LineupIncoming {
  return {
    id: candidate.id,
    espnAthleteId: candidate.espnAthleteId,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    position: candidate.position,
    teamAbbreviation: candidate.teamAbbreviation,
  };
}

/** Returns null when the bench player has no resolved BALLDONTLIE id. */
export function lineupIncomingFromBench(
  player: RosterPlayer,
): LineupIncoming | null {
  if (player.id == null) {
    return null;
  }
  return {
    id: player.id,
    espnAthleteId: player.espnAthleteId,
    firstName: player.firstName,
    lastName: player.lastName,
    position: player.position,
    teamAbbreviation: player.teamAbbreviation,
  };
}

/** Resolve BALLDONTLIE ids for a starting five (skips unresolved seeds). */
export function starterIdsFromPlayers(starters: RosterPlayer[]): number[] {
  return starters
    .map((player) => player.id)
    .filter((id): id is number => id != null);
}

/** Replace the starter in `swap.slot` with the incoming player. */
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

/** Real starter displaced by the swap (still on the Nets roster). */
export function outgoingStarter(
  starters: RosterPlayer[],
  swap: LineupSwap,
): RosterPlayer | null {
  return starters.find((player) => player.slot === swap.slot) ?? null;
}

/**
 * Bench during a sim:
 * - radar: displaced starter pinned at the front (as BENCH), then real bench
 * - bench: true exchange — incoming removed; displaced starter takes that spot
 */
export function buildSimBench(
  bench: RosterPlayer[],
  starters: RosterPlayer[],
  swap: LineupSwap,
): RosterPlayer[] {
  const outgoing = outgoingStarter(starters, swap);
  if (!outgoing) {
    return bench;
  }
  const pinned: RosterPlayer = { ...outgoing, slot: "BENCH" };

  if (swap.source === "bench") {
    return bench.map((player) =>
      player.id === swap.incoming.id ? pinned : player,
    );
  }

  return [pinned, ...bench];
}

export type LineupDragPayload = {
  source: LineupSwapSource;
  incoming: LineupIncoming;
};

export function parseLineupDragPayload(raw: string): LineupDragPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    // Legacy Radar-only payloads (pre-source field).
    if (!("source" in parsed) || !("incoming" in parsed)) {
      const legacy = parseIncomingFields(parsed);
      if (!legacy) return null;
      return { source: "radar", incoming: legacy };
    }

    if (parsed.source !== "radar" && parsed.source !== "bench") {
      return null;
    }
    if (typeof parsed.incoming !== "object" || parsed.incoming === null) {
      return null;
    }
    const incoming = parseIncomingFields(parsed.incoming);
    if (!incoming) return null;
    return { source: parsed.source, incoming };
  } catch {
    return null;
  }
}

/** @deprecated Prefer parseLineupDragPayload. */
export function parseRadarDragPayload(raw: string): RadarCandidate | null {
  const parsed = parseLineupDragPayload(raw);
  if (!parsed || parsed.source !== "radar") {
    return null;
  }
  return {
    ...parsed.incoming,
    position: parsed.incoming.position ?? "",
    teamAbbreviation: parsed.incoming.teamAbbreviation ?? "",
    espnAthleteId: parsed.incoming.espnAthleteId ?? 0,
    angle: "",
  };
}

function parseIncomingFields(value: object): LineupIncoming | null {
  if (
    !("id" in value) ||
    typeof value.id !== "number" ||
    !("firstName" in value) ||
    typeof value.firstName !== "string" ||
    !("lastName" in value) ||
    typeof value.lastName !== "string"
  ) {
    return null;
  }

  const espnAthleteId =
    "espnAthleteId" in value &&
    (typeof value.espnAthleteId === "number" || value.espnAthleteId === null)
      ? value.espnAthleteId
      : null;
  const position =
    "position" in value &&
    (typeof value.position === "string" || value.position === null)
      ? value.position
      : null;
  const teamAbbreviation =
    "teamAbbreviation" in value &&
    (typeof value.teamAbbreviation === "string" ||
      value.teamAbbreviation === null)
      ? value.teamAbbreviation
      : null;

  return {
    id: value.id,
    espnAthleteId,
    firstName: value.firstName,
    lastName: value.lastName,
    position,
    teamAbbreviation,
  };
}
