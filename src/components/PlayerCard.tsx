import type { ReactElement } from "react";

import type { RosterPlayer } from "@/domain/player";
import { PlayerAvatar } from "@/components/PlayerAvatar";

import styles from "./PlayerCard.module.css";

type PlayerCardProps = {
  player: RosterPlayer;
  onSelect?: (player: RosterPlayer) => void;
  /** Starters read larger on the court; bench stays compact. */
  size?: "starter" | "bench";
};

/**
 * Portrait “playing card” — image-forward frame, name band under the photo.
 */
export function PlayerCard({
  player,
  onSelect,
  size = "starter",
}: PlayerCardProps): ReactElement {
  const label = `${player.firstName} ${player.lastName}`;
  const sizeClass = size === "bench" ? styles.sizeBench : styles.starter;

  return (
    <button
      type="button"
      className={`${styles.card} ${sizeClass}`}
      onClick={() => onSelect?.(player)}
      aria-label={`Open dossier for ${label}`}
    >
      <span className={styles.photoWell}>
        <PlayerAvatar
          firstName={player.firstName}
          lastName={player.lastName}
          espnAthleteId={player.espnAthleteId}
          fill
        />
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{label}</span>
        {size === "bench" && player.position ? (
          <span className={styles.meta}>{player.position}</span>
        ) : null}
      </span>
    </button>
  );
}
