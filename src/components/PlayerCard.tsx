"use client";

import {
  useState,
  type DragEvent,
  type ReactElement,
} from "react";

import type { RosterPlayer } from "@/domain/player";
import {
  isStarterSlot,
  parseRadarDragPayload,
  RADAR_DRAG_MIME,
  type StarterSlot,
} from "@/domain/lineupSim";
import type { RadarCandidate } from "@/nba/radar/radarPool";
import { PlayerAvatar } from "@/components/PlayerAvatar";

import styles from "./PlayerCard.module.css";

type PlayerCardProps = {
  player: RosterPlayer;
  onSelect?: (player: RosterPlayer) => void;
  /** Starters read larger on the court; bench stays compact. */
  size?: "starter" | "bench";
  /**
   * When set, this starter card accepts Radar drops.
   * Unresolved starters (null id) never become drop targets.
   */
  onRadarDrop?: (slot: StarterSlot, candidate: RadarCandidate) => void;
  /** Highlight as a live drop / place target (pending keyboard swap). */
  dropArmed?: boolean;
};

/**
 * Portrait “playing card” — image-forward frame, name band under the photo.
 * Click opens the dossier; drag-drop from Radar swaps when wired.
 */
export function PlayerCard({
  player,
  onSelect,
  size = "starter",
  onRadarDrop,
  dropArmed = false,
}: PlayerCardProps): ReactElement {
  const label = `${player.firstName} ${player.lastName}`;
  const sizeClass = size === "bench" ? styles.sizeBench : styles.starter;
  const canDrop =
    onRadarDrop != null &&
    isStarterSlot(player.slot) &&
    player.id != null;
  const [dragOver, setDragOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLButtonElement>): void {
    if (!canDrop) return;
    if (![...event.dataTransfer.types].includes(RADAR_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function handleDragLeave(): void {
    setDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>): void {
    if (!canDrop || !isStarterSlot(player.slot)) return;
    event.preventDefault();
    setDragOver(false);
    const raw = event.dataTransfer.getData(RADAR_DRAG_MIME);
    const candidate = parseRadarDragPayload(raw);
    if (!candidate || !onRadarDrop) return;
    onRadarDrop(player.slot, candidate);
  }

  const dropClass =
    canDrop && (dropArmed || dragOver) ? styles.dropTarget : "";

  return (
    <button
      type="button"
      className={`${styles.card} ${sizeClass} ${dropClass}`}
      onClick={() => onSelect?.(player)}
      aria-label={
        dropArmed && canDrop
          ? `Place acquisition on ${player.slot}, currently ${label}`
          : `Open dossier for ${label}`
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
