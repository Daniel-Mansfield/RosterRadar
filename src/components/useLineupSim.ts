"use client";

import { useCallback, useMemo, useState } from "react";

import type { RosterPlayer } from "@/domain/player";
import {
  applyLineupSwap,
  starterIdsFromPlayers,
  type LineupSimState,
  type LineupSwap,
  type StarterSlot,
} from "@/domain/lineupSim";
import type { RadarCandidate } from "@/nba/radar/radarPool";

type UseLineupSimResult = {
  sim: LineupSimState;
  /** Starters as shown on court (real or simulated). */
  displayStarters: RosterPlayer[];
  /** Resolved ids for Lineup Fit (real or simulated). */
  displayStarterIds: number[];
  /** True while a hypothetical swap is active. */
  isSimulating: boolean;
  /** Radar candidate waiting for a keyboard/click slot pick. */
  pendingCandidate: RadarCandidate | null;
  beginPendingSwap: (candidate: RadarCandidate) => void;
  cancelPendingSwap: () => void;
  applySwap: (swap: LineupSwap) => void;
  /** Place the pending candidate onto a starter slot. */
  placeOnSlot: (slot: StarterSlot, starter: RosterPlayer) => boolean;
  reset: () => void;
};

/**
 * Client-side one-for-one Radar → starter simulation.
 * Does not mutate the server roster prop; Fit refetch follows display ids.
 */
export function useLineupSim(starters: RosterPlayer[]): UseLineupSimResult {
  const [sim, setSim] = useState<LineupSimState>({ status: "idle" });
  const [pendingCandidate, setPendingCandidate] =
    useState<RadarCandidate | null>(null);

  const displayStarters = useMemo(() => {
    if (sim.status !== "simulating") {
      return starters;
    }
    return applyLineupSwap(starters, sim.swap);
  }, [sim, starters]);

  const displayStarterIds = useMemo(
    () => starterIdsFromPlayers(displayStarters),
    [displayStarters],
  );

  const beginPendingSwap = useCallback((candidate: RadarCandidate) => {
    setPendingCandidate(candidate);
  }, []);

  const cancelPendingSwap = useCallback(() => {
    setPendingCandidate(null);
  }, []);

  const applySwap = useCallback((swap: LineupSwap) => {
    setSim({ status: "simulating", swap });
    setPendingCandidate(null);
  }, []);

  const placeOnSlot = useCallback(
    (slot: StarterSlot, starter: RosterPlayer): boolean => {
      if (starter.id == null || !pendingCandidate) {
        return false;
      }
      applySwap({
        slot,
        outgoingId: starter.id,
        incoming: pendingCandidate,
      });
      return true;
    },
    [applySwap, pendingCandidate],
  );

  const reset = useCallback(() => {
    setSim({ status: "idle" });
    setPendingCandidate(null);
  }, []);

  return {
    sim,
    displayStarters,
    displayStarterIds,
    isSimulating: sim.status === "simulating",
    pendingCandidate,
    beginPendingSwap,
    cancelPendingSwap,
    applySwap,
    placeOnSlot,
    reset,
  };
}
