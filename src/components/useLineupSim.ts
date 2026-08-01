"use client";

import { useCallback, useMemo, useState } from "react";

import type { RosterPlayer } from "@/domain/player";
import {
  applyLineupSwap,
  buildSimBench,
  lineupIncomingFromBench,
  lineupIncomingFromRadar,
  outgoingStarter,
  starterIdsFromPlayers,
  type LineupIncoming,
  type LineupSimState,
  type LineupSwap,
  type LineupSwapSource,
  type StarterSlot,
} from "@/domain/lineupSim";
import type { RadarCandidate } from "@/nba/radar/radarPool";

export type PendingLineupIncoming = {
  source: LineupSwapSource;
  incoming: LineupIncoming;
};

type UseLineupSimResult = {
  sim: LineupSimState;
  /** Starters as shown on court (real or simulated). */
  displayStarters: RosterPlayer[];
  /** Bench as shown — radar pin or bench true-exchange. */
  displayBench: RosterPlayer[];
  /** BDL id of radar-displaced starter (bench “Out” badge), if any. */
  displacedPlayerId: number | null;
  /** Resolved ids for Lineup Fit (real or simulated). */
  displayStarterIds: number[];
  /** True while a hypothetical swap is active. */
  isSimulating: boolean;
  /** Incoming player waiting for a keyboard/click slot pick. */
  pendingIncoming: PendingLineupIncoming | null;
  beginPendingRadar: (candidate: RadarCandidate) => void;
  beginPendingBench: (player: RosterPlayer) => boolean;
  cancelPendingSwap: () => void;
  applySwap: (swap: LineupSwap) => void;
  /** Place the pending incoming onto a starter slot. */
  placeOnSlot: (slot: StarterSlot, starter: RosterPlayer) => boolean;
  reset: () => void;
};

/**
 * Client-side one-for-one lineup simulation (Radar or bench → starter).
 * Does not mutate the server roster prop; Fit refetch follows display ids.
 */
export function useLineupSim(
  starters: RosterPlayer[],
  bench: RosterPlayer[],
): UseLineupSimResult {
  const [sim, setSim] = useState<LineupSimState>({ status: "idle" });
  const [pendingIncoming, setPendingIncoming] =
    useState<PendingLineupIncoming | null>(null);

  const displayStarters = useMemo(() => {
    if (sim.status !== "simulating") {
      return starters;
    }
    return applyLineupSwap(starters, sim.swap);
  }, [sim, starters]);

  const displayBench = useMemo(() => {
    if (sim.status !== "simulating") {
      return bench;
    }
    return buildSimBench(bench, starters, sim.swap);
  }, [sim, bench, starters]);

  const displacedPlayerId = useMemo(() => {
    if (sim.status !== "simulating" || sim.swap.source !== "radar") {
      return null;
    }
    return outgoingStarter(starters, sim.swap)?.id ?? null;
  }, [sim, starters]);

  const displayStarterIds = useMemo(
    () => starterIdsFromPlayers(displayStarters),
    [displayStarters],
  );

  const beginPendingRadar = useCallback((candidate: RadarCandidate) => {
    // Second tap on the same pressed swap icon cancels (touch-friendly).
    setPendingIncoming((prev) => {
      if (prev?.source === "radar" && prev.incoming.id === candidate.id) {
        return null;
      }
      return {
        source: "radar",
        incoming: lineupIncomingFromRadar(candidate),
      };
    });
  }, []);

  const beginPendingBench = useCallback((player: RosterPlayer): boolean => {
    const incoming = lineupIncomingFromBench(player);
    if (!incoming) {
      return false;
    }
    setPendingIncoming((prev) => {
      if (prev?.source === "bench" && prev.incoming.id === incoming.id) {
        return null;
      }
      return { source: "bench", incoming };
    });
    return true;
  }, []);

  const cancelPendingSwap = useCallback(() => {
    setPendingIncoming(null);
  }, []);

  const applySwap = useCallback((swap: LineupSwap) => {
    setSim({ status: "simulating", swap });
    setPendingIncoming(null);
  }, []);

  const placeOnSlot = useCallback(
    (slot: StarterSlot, starter: RosterPlayer): boolean => {
      if (starter.id == null || !pendingIncoming) {
        return false;
      }
      applySwap({
        slot,
        outgoingId: starter.id,
        incoming: pendingIncoming.incoming,
        source: pendingIncoming.source,
      });
      return true;
    },
    [applySwap, pendingIncoming],
  );

  const reset = useCallback(() => {
    setSim({ status: "idle" });
    setPendingIncoming(null);
  }, []);

  return {
    sim,
    displayStarters,
    displayBench,
    displacedPlayerId,
    displayStarterIds,
    isSimulating: sim.status === "simulating",
    pendingIncoming,
    beginPendingRadar,
    beginPendingBench,
    cancelPendingSwap,
    applySwap,
    placeOnSlot,
    reset,
  };
}
