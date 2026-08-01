import type { ReactElement } from "react";

import type { RosterPlayer } from "@/domain/player";
import type { LineupDragPayload, StarterSlot } from "@/domain/lineupSim";
import { PlayerCard } from "@/components/PlayerCard";

import styles from "./HalfCourt.module.css";

const STARTER_ORDER = ["PG", "SG", "SF", "PF", "C"] as const;

const slotClass = {
  PG: styles.slotPG ?? "",
  SG: styles.slotSG ?? "",
  SF: styles.slotSF ?? "",
  PF: styles.slotPF ?? "",
  C: styles.slotC ?? "",
} as const;

type HalfCourtProps = {
  starters: RosterPlayer[];
  onSelectPlayer?: (player: RosterPlayer) => void;
  onLineupDrop?: (slot: StarterSlot, payload: LineupDragPayload) => void;
  /** When true, starter cards highlight as place targets. */
  dropArmed?: boolean;
};

export function HalfCourt({
  starters,
  onSelectPlayer,
  onLineupDrop,
  dropArmed = false,
}: HalfCourtProps): ReactElement {
  const bySlot = new Map(starters.map((player) => [player.slot, player]));

  return (
    <section
      className={styles.court}
      aria-label="Brooklyn Nets starting five"
      data-tour="court"
    >
      {STARTER_ORDER.map((slot) => {
        const player = bySlot.get(slot);
        return (
          <div key={slot} className={slotClass[slot]}>
            <span className={styles.slotLabel}>{slot}</span>
            {player ? (
              <PlayerCard
                player={player}
                onSelect={onSelectPlayer}
                size="starter"
                onLineupDrop={onLineupDrop}
                dropArmed={dropArmed}
              />
            ) : (
              <div className={styles.empty}>—</div>
            )}
          </div>
        );
      })}
    </section>
  );
}
