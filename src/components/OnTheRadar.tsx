"use client";

import {
  useId,
  useRef,
  useState,
  type DragEvent,
  type ReactElement,
} from "react";

import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RADAR_DRAG_MIME } from "@/domain/lineupSim";
import {
  RADAR_PICK_COUNT,
  RADAR_POOL,
  pickRadarCandidates,
  type RadarCandidate,
} from "@/nba/radar/radarPool";

import styles from "./OnTheRadar.module.css";

type OnTheRadarProps = {
  onSelectCandidate: (candidate: RadarCandidate) => void;
  /** Begin keyboard/click place mode — user then picks a starter slot. */
  onBeginPlace?: (candidate: RadarCandidate) => void;
  /** Candidate currently waiting for a court slot (highlight its row). */
  pendingCandidateId?: number | null;
};

/**
 * Rotating acquisition shortlist for the left court gutter.
 *
 * The shuffle is intentionally random per page load, so this component must
 * only render on the client (`next/dynamic` with `ssr: false` in NetsHome) —
 * server-rendering random markup would break hydration. The header button
 * reshuffles on demand; the pool is static, so shuffling costs no API calls.
 *
 * Rows are draggable onto starters; click still opens the dossier. A Place
 * control arms keyboard/click placement for a11y without relying on DnD.
 */
export function OnTheRadar({
  onSelectCandidate,
  onBeginPlace,
  pendingCandidateId = null,
}: OnTheRadarProps): ReactElement {
  // Lazy initializer: one shuffle per mount, stable across re-renders.
  const [picks, setPicks] = useState<RadarCandidate[]>(() =>
    pickRadarCandidates(RADAR_POOL, RADAR_PICK_COUNT),
  );
  // Keyed to the icon so each click retriggers the spin animation.
  const [shuffleCount, setShuffleCount] = useState(0);
  const headingId = useId();
  const draggedRef = useRef(false);

  function reshuffle(): void {
    setPicks(pickRadarCandidates(RADAR_POOL, RADAR_PICK_COUNT));
    setShuffleCount((count) => count + 1);
  }

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    candidate: RadarCandidate,
  ): void {
    draggedRef.current = true;
    event.dataTransfer.setData(RADAR_DRAG_MIME, JSON.stringify(candidate));
    event.dataTransfer.effectAllowed = "copy";
  }

  function handleDragEnd(): void {
    // Click fires after drag on some browsers; ignore the post-drag click.
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  }

  function handleRowClick(candidate: RadarCandidate): void {
    if (draggedRef.current) return;
    onSelectCandidate(candidate);
  }

  return (
    <aside
      className={styles.radar}
      aria-labelledby={headingId}
      data-tour="radar"
    >
      <div className={styles.headerRow}>
        <h2 id={headingId} className={styles.title}>
          On the <span className={styles.radarWord}>Radar</span>
        </h2>
        <button
          type="button"
          className={styles.shuffle}
          onClick={reshuffle}
          aria-label="Shuffle the shortlist"
          title="Shuffle the shortlist"
        >
          <svg
            key={shuffleCount}
            className={styles.shuffleIcon}
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M13.65 2.35A7.96 7.96 0 0 0 8 0C3.58 0 .01 3.58.01 8S3.58 16 8 16a7.99 7.99 0 0 0 7.73-6h-2.08A5.99 5.99 0 0 1 8 14 6 6 0 1 1 8 2c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" />
          </svg>
        </button>
      </div>
      <p className={styles.subtitle}>
        Drag onto a starter — or Place, then pick a slot
      </p>
      <ul className={styles.list}>
        {picks.map((candidate) => {
          const pending = pendingCandidateId === candidate.id;
          return (
            <li key={candidate.id} className={styles.item}>
              <div
                className={`${styles.rowWrap} ${pending ? styles.rowPending : ""}`}
              >
                <button
                  type="button"
                  className={styles.row}
                  draggable
                  onDragStart={(event) => handleDragStart(event, candidate)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleRowClick(candidate)}
                >
                  <span className={styles.srOnly}>Open dossier for </span>
                  <PlayerAvatar
                    firstName={candidate.firstName}
                    lastName={candidate.lastName}
                    espnAthleteId={candidate.espnAthleteId}
                    size={60}
                    shape="rounded"
                  />
                  <span className={styles.rowBody}>
                    <span className={styles.name}>
                      {candidate.firstName} {candidate.lastName}
                    </span>
                    <span className={styles.meta}>
                      {candidate.teamAbbreviation} · {candidate.position}
                    </span>
                    <span className={styles.angle}>{candidate.angle}</span>
                  </span>
                </button>
                {onBeginPlace ? (
                  <button
                    type="button"
                    className={styles.place}
                    onClick={() => onBeginPlace(candidate)}
                    aria-pressed={pending}
                    aria-label={`Place ${candidate.firstName} ${candidate.lastName} on a starter slot`}
                  >
                    Place
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
