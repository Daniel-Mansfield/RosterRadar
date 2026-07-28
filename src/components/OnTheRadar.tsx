"use client";

import { useId, useState, type ReactElement } from "react";

import { PlayerAvatar } from "@/components/PlayerAvatar";
import {
  RADAR_PICK_COUNT,
  RADAR_POOL,
  pickRadarCandidates,
  type RadarCandidate,
} from "@/nba/radar/radarPool";

import styles from "./OnTheRadar.module.css";

type OnTheRadarProps = {
  onSelectCandidate: (candidate: RadarCandidate) => void;
};

/**
 * Rotating acquisition shortlist for the left court gutter.
 *
 * The shuffle is intentionally random per page load, so this component must
 * only render on the client (`next/dynamic` with `ssr: false` in NetsHome) —
 * server-rendering random markup would break hydration. The header button
 * reshuffles on demand; the pool is static, so shuffling costs no API calls.
 */
export function OnTheRadar({
  onSelectCandidate,
}: OnTheRadarProps): ReactElement {
  // Lazy initializer: one shuffle per mount, stable across re-renders.
  const [picks, setPicks] = useState<RadarCandidate[]>(() =>
    pickRadarCandidates(RADAR_POOL, RADAR_PICK_COUNT),
  );
  // Keyed to the icon so each click retriggers the spin animation.
  const [shuffleCount, setShuffleCount] = useState(0);
  const headingId = useId();

  function reshuffle(): void {
    setPicks(pickRadarCandidates(RADAR_POOL, RADAR_PICK_COUNT));
    setShuffleCount((count) => count + 1);
  }

  return (
    <aside className={styles.radar} aria-labelledby={headingId}>
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
        A rotating shortlist of acquisition targets
      </p>
      <ul className={styles.list}>
        {picks.map((candidate) => (
          <li key={candidate.id} className={styles.item}>
            {/* No aria-label: the visible content (name, team, angle) is the
                accessible name, prefixed with a hidden action verb. */}
            <button
              type="button"
              className={styles.row}
              onClick={() => onSelectCandidate(candidate)}
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
          </li>
        ))}
      </ul>
    </aside>
  );
}
