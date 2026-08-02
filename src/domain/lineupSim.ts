import type { CourtSlot, PlayerSummary, RosterPlayer } from "@/domain/player";
import type { RadarCandidate } from "@/nba/radar/radarPool";

/** Starter slots that can receive a lineup swap. */
export type StarterSlot = Exclude<CourtSlot, "BENCH">;

/** Shared shape for acquisition, bench, or returning Out players. */
export type LineupIncoming = {
  id: number;
  espnAthleteId: number | null;
  firstName: string;
  lastName: string;
  position: string | null;
  teamAbbreviation: string | null;
};

/**
 * Where the incoming player came from.
 *
 * - `acquisition`: non-Nets candidate (Radar / search)
 * - `bench`: real bench → starter (true exchange on the bench list)
 * - `return`: Out-pinned real starter placed back onto a slot
 */
export type LineupSwapSource = "acquisition" | "bench" | "return";

export function isAcquisitionSource(
  source: LineupSwapSource,
): source is "acquisition" {
  return source === "acquisition";
}

/**
 * One slot override in an accumulated hypothetical five.
 * Not a trade engine (no salary, packages, or synergy).
 */
export type LineupSlotOverride = {
  slot: StarterSlot;
  incoming: LineupIncoming;
  source: LineupSwapSource;
};

/** @deprecated Prefer LineupSlotOverride — single-swap era name. */
export type LineupSwap = LineupSlotOverride & {
  /** BALLDONTLIE id of the real starter for this slot (informational). */
  outgoingId: number;
};

export type LineupSimState =
  | { status: "idle" }
  | { status: "simulating"; overrides: LineupSlotOverride[] };

/** MIME type for HTML5 drag payloads (acquisition, bench, or return → starter). */
export const LINEUP_DRAG_MIME = "application/x-rosterradar-lineup-incoming";

/** @deprecated Use LINEUP_DRAG_MIME — kept so in-flight drops still parse. */
export const RADAR_DRAG_MIME = LINEUP_DRAG_MIME;

const STARTER_SLOT_ORDER: StarterSlot[] = ["PG", "SG", "SF", "PF", "C"];

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

/** Acquisition search (or any PlayerSummary) → lineup incoming. */
export function lineupIncomingFromSummary(player: PlayerSummary): LineupIncoming {
  return {
    id: player.id,
    espnAthleteId: player.espnAthleteId,
    firstName: player.firstName,
    lastName: player.lastName,
    position: player.position,
    teamAbbreviation: player.teamAbbreviation,
  };
}

/** Returns null when the bench/Out player has no resolved BALLDONTLIE id. */
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

function overrideMap(
  overrides: readonly LineupSlotOverride[],
): Map<StarterSlot, LineupSlotOverride> {
  return new Map(overrides.map((override) => [override.slot, override]));
}

/** Apply accumulated slot overrides onto the real starting five. */
export function applyLineupOverrides(
  starters: RosterPlayer[],
  overrides: readonly LineupSlotOverride[],
): RosterPlayer[] {
  const bySlot = overrideMap(overrides);
  return starters.map((player) => {
    if (!isStarterSlot(player.slot)) {
      return player;
    }
    const override = bySlot.get(player.slot);
    if (!override) {
      return player;
    }
    return {
      id: override.incoming.id,
      espnAthleteId: override.incoming.espnAthleteId,
      firstName: override.incoming.firstName,
      lastName: override.incoming.lastName,
      position: override.incoming.position,
      teamAbbreviation: override.incoming.teamAbbreviation,
      slot: player.slot,
    };
  });
}

/** @deprecated Prefer applyLineupOverrides. */
export function applyLineupSwap(
  starters: RosterPlayer[],
  swap: LineupSlotOverride,
): RosterPlayer[] {
  return applyLineupOverrides(starters, [swap]);
}

/** Real starter currently assigned to a slot on the real roster. */
export function realStarterInSlot(
  starters: readonly RosterPlayer[],
  slot: StarterSlot,
): RosterPlayer | null {
  return starters.find((player) => player.slot === slot) ?? null;
}

/** @deprecated Prefer realStarterInSlot. */
export function outgoingStarter(
  starters: readonly RosterPlayer[],
  swap: LineupSlotOverride,
): RosterPlayer | null {
  return realStarterInSlot(starters, swap.slot);
}

/** True when this id already occupies a simulated starter slot. */
export function isIncomingOnSimFive(
  displayStarters: readonly RosterPlayer[],
  incomingId: number,
): boolean {
  return displayStarters.some((player) => player.id === incomingId);
}

/**
 * Upsert a slot override. Returning a real starter to their home slot clears
 * that override. Empty result → caller should idle the sim.
 */
export function upsertLineupOverride(
  overrides: readonly LineupSlotOverride[],
  next: LineupSlotOverride,
  starters: readonly RosterPlayer[],
): LineupSlotOverride[] {
  const home = starters.find((player) => player.id === next.incoming.id);
  const withoutSlot = overrides.filter((override) => override.slot !== next.slot);

  if (home && isStarterSlot(home.slot) && home.slot === next.slot) {
    return withoutSlot;
  }

  const source: LineupSwapSource =
    home && isStarterSlot(home.slot) ? "return" : next.source;

  return [...withoutSlot, { ...next, source }];
}

/**
 * Real starters absent from the simulated five.
 * Ordered PG → C for stable UI.
 */
export function displacedRealStarters(
  starters: readonly RosterPlayer[],
  displayStarters: readonly RosterPlayer[],
): RosterPlayer[] {
  const onFive = new Set(
    displayStarters
      .map((player) => player.id)
      .filter((id): id is number => id != null),
  );

  return STARTER_SLOT_ORDER.flatMap((slot) => {
    const real = starters.find((player) => player.slot === slot);
    if (!real || real.id == null || onFive.has(real.id)) {
      return [];
    }
    return [{ ...real, slot: "BENCH" as const }];
  });
}

/**
 * Out-badge pins: real starters displaced by acquisition or return overrides.
 * Bench true-exchanges seat the displaced starter on the bench list without Out.
 */
export function outPinnedRealStarters(
  starters: readonly RosterPlayer[],
  displayStarters: readonly RosterPlayer[],
  overrides: readonly LineupSlotOverride[],
): RosterPlayer[] {
  const bySlot = overrideMap(overrides);
  const onFive = new Set(
    displayStarters
      .map((player) => player.id)
      .filter((id): id is number => id != null),
  );

  return STARTER_SLOT_ORDER.flatMap((slot) => {
    const real = starters.find((player) => player.slot === slot);
    if (!real || real.id == null || onFive.has(real.id)) {
      return [];
    }
    const override = bySlot.get(slot);
    if (!override || override.source === "bench") {
      return [];
    }
    return [{ ...real, slot: "BENCH" as const }];
  });
}

/**
 * Bench during a multi-slot sim:
 * - bench-source overrides exchange in place (incoming seat ← real starter)
 * - remaining displaced real starters are prepended (Out pins)
 */
export function buildSimBench(
  bench: RosterPlayer[],
  starters: RosterPlayer[],
  overrides: readonly LineupSlotOverride[],
): RosterPlayer[] {
  const display = applyLineupOverrides(starters, overrides);
  const onFive = new Set(
    display
      .map((player) => player.id)
      .filter((id): id is number => id != null),
  );

  let working = [...bench];
  for (const override of overrides) {
    if (override.source !== "bench") {
      continue;
    }
    const realAtSlot = realStarterInSlot(starters, override.slot);
    if (!realAtSlot) {
      continue;
    }
    working = working.map((player) =>
      player.id === override.incoming.id
        ? { ...realAtSlot, slot: "BENCH" }
        : player,
    );
  }

  working = working.filter(
    (player) => player.id == null || !onFive.has(player.id),
  );

  const inWorking = new Set(
    working.map((player) => player.id).filter((id): id is number => id != null),
  );
  const pins = displacedRealStarters(starters, display).filter(
    (player) => player.id != null && !inWorking.has(player.id),
  );

  return [...pins, ...working];
}

/** One stacked Fit-banner row (slot is the stable React key). */
export type LineupSimSummaryLine = {
  slot: StarterSlot;
  text: string;
};

/** One banner line per changed slot (PG→C), vs the real five. */
export function lineupSimSummaryLines(
  starters: readonly RosterPlayer[],
  overrides: readonly LineupSlotOverride[],
): LineupSimSummaryLine[] {
  const bySlot = overrideMap(overrides);
  const lines: LineupSimSummaryLine[] = [];

  for (const slot of STARTER_SLOT_ORDER) {
    const override = bySlot.get(slot);
    if (!override) continue;
    const real = realStarterInSlot(starters, slot);
    const outName = real
      ? `${real.firstName} ${real.lastName}`
      : slot;
    const inName = `${override.incoming.firstName} ${override.incoming.lastName}`;
    lines.push({
      slot,
      text: `${inName} in for ${outName} (${slot})`,
    });
  }

  return lines;
}

export type LineupDragPayload = {
  source: LineupSwapSource;
  incoming: LineupIncoming;
};

function normalizeDragSource(value: unknown): LineupSwapSource | null {
  if (value === "acquisition" || value === "bench" || value === "return") {
    return value;
  }
  // Pre-rename payloads used "radar" for acquisition candidates.
  if (value === "radar") {
    return "acquisition";
  }
  return null;
}

export function parseLineupDragPayload(raw: string): LineupDragPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    // Legacy flat Radar-only payloads (pre-source field).
    if (!("source" in parsed) || !("incoming" in parsed)) {
      const legacy = parseIncomingFields(parsed);
      if (!legacy) return null;
      return { source: "acquisition", incoming: legacy };
    }

    const source = normalizeDragSource(parsed.source);
    if (!source) {
      return null;
    }
    if (typeof parsed.incoming !== "object" || parsed.incoming === null) {
      return null;
    }
    const incoming = parseIncomingFields(parsed.incoming);
    if (!incoming) return null;
    return { source, incoming };
  } catch {
    return null;
  }
}

/** @deprecated Prefer parseLineupDragPayload. */
export function parseRadarDragPayload(raw: string): RadarCandidate | null {
  const parsed = parseLineupDragPayload(raw);
  if (!parsed || !isAcquisitionSource(parsed.source)) {
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
