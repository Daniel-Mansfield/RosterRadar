import type { ReactElement } from "react";

import type { RosterPlayer } from "@/domain/player";
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
};

export function HalfCourt({
  starters,
  onSelectPlayer,
}: HalfCourtProps): ReactElement {
  const bySlot = new Map(starters.map((player) => [player.slot, player]));

  return (
    <section className={styles.court} aria-label="Brooklyn Nets starting five">
      <div className={styles.paint} aria-hidden="true" />
      <div className={styles.ftCircle} aria-hidden="true" />
      <div className={styles.hoop} aria-hidden="true" />

      {STARTER_ORDER.map((slot) => {
        const player = bySlot.get(slot);
        return (
          <div key={slot} className={slotClass[slot]}>
            <span className={styles.slotLabel}>{slot}</span>
            {player ? (
              <PlayerCard player={player} onSelect={onSelectPlayer} />
            ) : (
              <div className={styles.empty}>—</div>
            )}
          </div>
        );
      })}
    </section>
  );
}
