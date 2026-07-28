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
 * server-rendering random markup would break hydration.
 */
export function OnTheRadar({
  onSelectCandidate,
}: OnTheRadarProps): ReactElement {
  // Lazy initializer: one shuffle per mount, stable across re-renders.
  const [picks] = useState<RadarCandidate[]>(() =>
    pickRadarCandidates(RADAR_POOL, RADAR_PICK_COUNT),
  );
  const headingId = useId();

  return (
    <aside className={styles.radar} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.title}>
        On the <span className={styles.radarWord}>Radar</span>
      </h2>
      <p className={styles.subtitle}>Acquisition targets worth a look</p>
      <ul className={styles.list}>
        {picks.map((candidate) => (
          <li key={candidate.id}>
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
                size={44}
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
