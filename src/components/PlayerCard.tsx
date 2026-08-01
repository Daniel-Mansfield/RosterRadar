"use client";

import {
  useRef,
  useState,
  type DragEvent,
  type ReactElement,
} from "react";

import type { RosterPlayer } from "@/domain/player";
import {
  isStarterSlot,
  lineupIncomingFromBench,
  LINEUP_DRAG_MIME,
  parseLineupDragPayload,
  type LineupDragPayload,
  type StarterSlot,
} from "@/domain/lineupSim";
import { PlayerAvatar } from "@/components/PlayerAvatar";

import styles from "./PlayerCard.module.css";

type PlayerCardProps = {
  player: RosterPlayer;
  onSelect?: (player: RosterPlayer) => void;
  /** Starters read larger on the court; bench stays compact. */
  size?: "starter" | "bench";
  /**
   * When set, this starter card accepts Radar / bench drops.
   * Unresolved starters (null id) never become drop targets.
   */
  onLineupDrop?: (slot: StarterSlot, payload: LineupDragPayload) => void;
  /** Highlight as a live drop / place target (pending keyboard swap). */
  dropArmed?: boolean;
  /** Hypothetically displaced starter sitting on the bench during a sim. */
  outOfLineup?: boolean;
  /** Allow dragging this bench card onto a starter. */
  draggableToCourt?: boolean;
};

/**
 * Portrait “playing card” — image-forward frame, name band under the photo.
 * Click opens the dossier; drag-drop swaps when wired.
 */
export function PlayerCard({
  player,
  onSelect,
  size = "starter",
  onLineupDrop,
  dropArmed = false,
  outOfLineup = false,
  draggableToCourt = false,
}: PlayerCardProps): ReactElement {
  const label = `${player.firstName} ${player.lastName}`;
  const sizeClass = size === "bench" ? styles.sizeBench : styles.starter;
  const canDrop =
    onLineupDrop != null &&
    isStarterSlot(player.slot) &&
    player.id != null;
  const canDrag =
    draggableToCourt &&
    !outOfLineup &&
    lineupIncomingFromBench(player) != null;
  const [dragOver, setDragOver] = useState(false);
  const draggedRef = useRef(false);

  function handleDragOver(event: DragEvent<HTMLButtonElement>): void {
    if (!canDrop) return;
    if (![...event.dataTransfer.types].includes(LINEUP_DRAG_MIME)) return;
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
    const raw = event.dataTransfer.getData(LINEUP_DRAG_MIME);
    const payload = parseLineupDragPayload(raw);
    if (!payload || !onLineupDrop) return;
    onLineupDrop(player.slot, payload);
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>): void {
    const incoming = lineupIncomingFromBench(player);
    if (!canDrag || !incoming) {
      event.preventDefault();
      return;
    }
    draggedRef.current = true;
    const payload: LineupDragPayload = { source: "bench", incoming };
    event.dataTransfer.setData(LINEUP_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "copy";
  }

  function handleDragEnd(): void {
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  }

  function handleClick(): void {
    if (draggedRef.current) return;
    onSelect?.(player);
  }

  const dropClass =
    canDrop && (dropArmed || dragOver) ? styles.dropTarget : "";
  const outClass = outOfLineup ? styles.outOfLineup : "";

  return (
    <button
      type="button"
      className={`${styles.card} ${sizeClass} ${dropClass} ${outClass}`}
      onClick={handleClick}
      draggable={canDrag}
      aria-label={
        dropArmed && canDrop
          ? `Swap incoming player onto ${player.slot}, currently ${label}`
          : outOfLineup
            ? `Open dossier for ${label}, out of lineup in this simulation`
            : `Open dossier for ${label}`
      }
      onDragStart={canDrag ? handleDragStart : undefined}
      onDragEnd={canDrag ? handleDragEnd : undefined}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {outOfLineup ? (
        <span className={styles.outBadge} aria-hidden="true">
          Out
        </span>
      ) : null}
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
