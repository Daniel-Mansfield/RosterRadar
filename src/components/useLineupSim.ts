import { useCallback, useMemo, useState } from "react";

import type { RosterPlayer } from "@/domain/player";
import {
  applyLineupOverrides,
  buildSimBench,
  isIncomingOnSimFive,
  isStarterSlot,
  outPinnedRealStarters,
  lineupIncomingFromBench,
  lineupIncomingFromRadar,
  lineupSimSummaryLines,
  realStarterInSlot,
  starterIdsFromPlayers,
  upsertLineupOverride,
  type LineupIncoming,
  type LineupSimState,
  type LineupSimSummaryLine,
  type LineupSlotOverride,
  type LineupSwapSource,
  type StarterSlot,
} from "@/domain/lineupSim";
import type { RadarCandidate } from "@/nba/radar/radarPool";

const EMPTY_OVERRIDES: LineupSlotOverride[] = [];

export type PendingLineupIncoming = {
  source: LineupSwapSource;
  incoming: LineupIncoming;
};

type UseLineupSimResult = {
  sim: LineupSimState;
  /** Starters as shown on court (real or simulated). */
  displayStarters: RosterPlayer[];
  /** Bench as shown — Out pins + bench exchanges. */
  displayBench: RosterPlayer[];
  /** BDL ids of real starters absent from the simulated five (Out badges). */
  displacedPlayerIds: number[];
  /** Resolved ids for Lineup Fit (real or simulated). */
  displayStarterIds: number[];
  /** True while at least one slot override is active. */
  isSimulating: boolean;
  /** Banner lines for each changed slot (PG→C). */
  simSummaryLines: LineupSimSummaryLine[];
  /** Incoming player waiting for a keyboard/click slot pick. */
  pendingIncoming: PendingLineupIncoming | null;
  beginPendingRadar: (candidate: RadarCandidate) => void;
  beginPendingAcquisition: (incoming: LineupIncoming) => void;
  beginPendingBench: (player: RosterPlayer) => boolean;
  /** Out-pinned real starter → place back onto a slot. */
  beginPendingReturn: (player: RosterPlayer) => boolean;
  cancelPendingSwap: () => void;
  /** Place acquisition / bench / return incoming onto a starter slot. */
  placeIncomingOnSlot: (
    slot: StarterSlot,
    source: LineupSwapSource,
    incoming: LineupIncoming,
  ) => boolean;
  /** Place the pending incoming onto a starter slot. */
  placeOnSlot: (slot: StarterSlot) => boolean;
  reset: () => void;
};

/**
 * Client-side accumulated lineup simulation (multi-slot).
 * Each Radar/search/bench/return placement upserts one slot; Reset clears all.
 * Does not mutate the server roster prop; Fit refetch follows display ids.
 */
export function useLineupSim(
  starters: RosterPlayer[],
  bench: RosterPlayer[],
): UseLineupSimResult {
  const [sim, setSim] = useState<LineupSimState>({ status: "idle" });
  const [pendingIncoming, setPendingIncoming] =
    useState<PendingLineupIncoming | null>(null);

  const overrides =
    sim.status === "simulating" ? sim.overrides : EMPTY_OVERRIDES;

  const displayStarters = useMemo(() => {
    if (overrides.length === 0) {
      return starters;
    }
    return applyLineupOverrides(starters, overrides);
  }, [overrides, starters]);

  const displayBench = useMemo(() => {
    if (overrides.length === 0) {
      return bench;
    }
    return buildSimBench(bench, starters, overrides);
  }, [overrides, bench, starters]);

  const displacedPlayerIds = useMemo(() => {
    if (overrides.length === 0) {
      return [];
    }
    return outPinnedRealStarters(starters, displayStarters, overrides)
      .map((player) => player.id)
      .filter((id): id is number => id != null);
  }, [overrides, starters, displayStarters]);

  const displayStarterIds = useMemo(
    () => starterIdsFromPlayers(displayStarters),
    [displayStarters],
  );

  const simSummaryLines = useMemo(() => {
    if (overrides.length === 0) {
      return [];
    }
    return lineupSimSummaryLines(starters, overrides);
  }, [overrides, starters]);

  const beginPendingWithSource = useCallback(
    (source: LineupSwapSource, incoming: LineupIncoming) => {
      setPendingIncoming((prev) => {
        if (
          prev &&
          prev.source === source &&
          prev.incoming.id === incoming.id
        ) {
          return null;
        }
        return { source, incoming };
      });
    },
    [],
  );

  const beginPendingAcquisition = useCallback(
    (incoming: LineupIncoming) => {
      beginPendingWithSource("acquisition", incoming);
    },
    [beginPendingWithSource],
  );

  const beginPendingRadar = useCallback(
    (candidate: RadarCandidate) => {
      beginPendingAcquisition(lineupIncomingFromRadar(candidate));
    },
    [beginPendingAcquisition],
  );

  const beginPendingBench = useCallback(
    (player: RosterPlayer): boolean => {
      const incoming = lineupIncomingFromBench(player);
      if (!incoming) {
        return false;
      }
      beginPendingWithSource("bench", incoming);
      return true;
    },
    [beginPendingWithSource],
  );

  const beginPendingReturn = useCallback(
    (player: RosterPlayer): boolean => {
      const incoming = lineupIncomingFromBench(player);
      if (!incoming) {
        return false;
      }
      beginPendingWithSource("return", incoming);
      return true;
    },
    [beginPendingWithSource],
  );

  const cancelPendingSwap = useCallback(() => {
    setPendingIncoming(null);
  }, []);

  const placeIncomingOnSlot = useCallback(
    (
      slot: StarterSlot,
      source: LineupSwapSource,
      incoming: LineupIncoming,
    ): boolean => {
      if (realStarterInSlot(starters, slot)?.id == null) {
        return false;
      }

      // Block re-placing someone already on the simulated five (except clearing
      // via return-to-home, handled inside upsert when ids match home slot).
      const home = starters.find((player) => player.id === incoming.id);
      const returningHome =
        home != null && home.slot === slot && isStarterSlot(home.slot);
      if (!returningHome && isIncomingOnSimFive(displayStarters, incoming.id)) {
        return false;
      }

      const nextOverrides = upsertLineupOverride(
        overrides,
        { slot, incoming, source },
        starters,
      );

      setSim(
        nextOverrides.length === 0
          ? { status: "idle" }
          : { status: "simulating", overrides: nextOverrides },
      );
      setPendingIncoming(null);
      return true;
    },
    [starters, displayStarters, overrides],
  );

  const placeOnSlot = useCallback(
    (slot: StarterSlot): boolean => {
      if (!pendingIncoming) {
        return false;
      }
      return placeIncomingOnSlot(
        slot,
        pendingIncoming.source,
        pendingIncoming.incoming,
      );
    },
    [pendingIncoming, placeIncomingOnSlot],
  );

  const reset = useCallback(() => {
    setSim({ status: "idle" });
    setPendingIncoming(null);
  }, []);

  return {
    sim,
    displayStarters,
    displayBench,
    displacedPlayerIds,
    displayStarterIds,
    isSimulating: sim.status === "simulating",
    simSummaryLines,
    pendingIncoming,
    beginPendingRadar,
    beginPendingAcquisition,
    beginPendingBench,
    beginPendingReturn,
    cancelPendingSwap,
    placeIncomingOnSlot,
    placeOnSlot,
    reset,
  };
}
