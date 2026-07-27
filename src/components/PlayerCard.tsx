import type { ReactElement } from "react";

import type { RosterPlayer } from "@/domain/player";

import styles from "./PlayerCard.module.css";

type PlayerCardProps = {
  player: RosterPlayer;
  onSelect?: (player: RosterPlayer) => void;
};

export function PlayerCard({
  player,
  onSelect,
}: PlayerCardProps): ReactElement {
  const label = `${player.firstName} ${player.lastName}`;

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onSelect?.(player)}
      aria-label={`Open dossier for ${label}`}
    >
      <span className={styles.name}>{label}</span>
      {player.position ? (
        <span className={styles.meta}>{player.position}</span>
      ) : null}
    </button>
  );
}
