"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactElement,
} from "react";

import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { PillarId } from "@/domain/dossier";
import {
  LINEUP_DRAG_MIME,
  lineupIncomingFromRadar,
  type LineupDragPayload,
} from "@/domain/lineupSim";
import type { TeamFitPillar } from "@/domain/teamFit";
import {
  isHardLineupGap,
  isPillarId,
  reorderByPillarScores,
  scoresByPlayerId,
} from "@/domain/radarGapReorder";
import { apiErrorSchema } from "@/lib/api/schemas";
import { radarScoresApiResponseSchema } from "@/lib/api/radarScoresSchema";
import {
  RADAR_PICK_COUNT,
  RADAR_POOL,
  pickRadarCandidates,
  type RadarCandidate,
} from "@/nba/radar/radarPool";
import { PILLAR_IDS, PILLAR_LABELS } from "@/scoring/composeDossier";

import styles from "./OnTheRadar.module.css";

type OnTheRadarProps = {
  onSelectCandidate: (candidate: RadarCandidate) => void;
  /** Begin keyboard/click swap mode — user then picks a starter slot. */
  onBeginPlace?: (candidate: RadarCandidate) => void;
  /** Candidate currently waiting for a court slot (highlight its row). */
  pendingCandidateId?: number | null;
  /**
   * Primary need from the real starting five's Lineup Fit (hard gap or
   * softest pillar). Null while Fit is still loading.
   */
  needPillar?: TeamFitPillar | null;
};

type SortStatus =
  | { kind: "idle" }
  | { kind: "loading"; pillarLabel: string }
  | {
      kind: "sorted";
      pillarLabel: string;
      /** Set when the sorted pillar matches the real five's primary need. */
      needKind: "gap" | "softest" | null;
    }
  | { kind: "error"; message: string };

/**
 * Acquisition shortlist for the court gutter.
 *
 * Shuffle draws a random subset of the curated pool (currently the full pool)
 * per mount / click — client-only (`next/dynamic` + `ssr: false`) so random
 * markup never hydrates against the server.
 *
 * Pillar sort reorders the *current* column by RR percentiles — not a
 * league-wide attribute search. The picker defaults to the real five's
 * primary Fit need when available.
 */
export function OnTheRadar({
  onSelectCandidate,
  onBeginPlace,
  pendingCandidateId = null,
  needPillar = null,
}: OnTheRadarProps): ReactElement {
  const [picks, setPicks] = useState<RadarCandidate[]>(() =>
    pickRadarCandidates(RADAR_POOL, RADAR_PICK_COUNT),
  );
  const [shuffleCount, setShuffleCount] = useState(0);
  const [sortPillarId, setSortPillarId] = useState<PillarId>(PILLAR_IDS[0]);
  const [pillarTouched, setPillarTouched] = useState(false);
  const [sortStatus, setSortStatus] = useState<SortStatus>({ kind: "idle" });
  const [justSorted, setJustSorted] = useState(false);
  const headingId = useId();
  const sortSelectId = useId();
  const draggedRef = useRef(false);
  const requestIdRef = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Prefer the real five's need until the user picks a different pillar.
  useEffect(() => {
    if (!pillarTouched && needPillar) {
      setSortPillarId(needPillar.id);
    }
  }, [needPillar, pillarTouched]);

  function reshuffle(): void {
    requestIdRef.current += 1;
    setPicks(pickRadarCandidates(RADAR_POOL, RADAR_PICK_COUNT));
    setShuffleCount((count) => count + 1);
    setSortStatus({ kind: "idle" });
    setJustSorted(false);
    listRef.current?.scrollTo({ top: 0 });
  }

  useEffect(() => {
    if (!justSorted) {
      return;
    }
    const timer = window.setTimeout(() => {
      setJustSorted(false);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [justSorted]);

  async function sortByPillar(pillarId: PillarId): Promise<void> {
    if (sortStatus.kind === "loading") {
      return;
    }

    // Lock the picker so a late Fit needPillar sync cannot desync the
    // dropdown from an in-flight or completed sort.
    setPillarTouched(true);
    setSortPillarId(pillarId);

    const requestId = ++requestIdRef.current;
    const pillarLabel = PILLAR_LABELS[pillarId];
    setSortStatus({ kind: "loading", pillarLabel });

    try {
      const ids = picks.map((pick) => pick.id).join(",");
      const response = await fetch(
        `/api/radar-scores?pillar=${pillarId}&ids=${ids}`,
      );
      const json: unknown = await response.json();

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const err = apiErrorSchema.safeParse(json);
        setSortStatus({
          kind: "error",
          message: err.success
            ? err.data.error.message
            : "Could not rank Radar by pillar.",
        });
        return;
      }

      const parsed = radarScoresApiResponseSchema.safeParse(json);
      if (!parsed.success) {
        setSortStatus({
          kind: "error",
          message: "Radar scores failed validation.",
        });
        return;
      }

      setPicks(
        reorderByPillarScores(picks, scoresByPlayerId(parsed.data.scores)),
      );
      listRef.current?.scrollTo({ top: 0 });
      setJustSorted(true);

      let needKind: "gap" | "softest" | null = null;
      if (needPillar && needPillar.id === pillarId) {
        needKind = isHardLineupGap(needPillar) ? "gap" : "softest";
      }
      setSortStatus({
        kind: "sorted",
        pillarLabel: parsed.data.pillar.label,
        needKind,
      });
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setSortStatus({
        kind: "error",
        message: "Could not reach Radar scores API.",
      });
    }
  }

  function handlePillarChange(event: ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value;
    if (!isPillarId(value)) return;
    setPillarTouched(true);
    setSortPillarId(value);
    void sortByPillar(value);
  }

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    candidate: RadarCandidate,
  ): void {
    draggedRef.current = true;
    const payload: LineupDragPayload = {
      source: "acquisition",
      incoming: lineupIncomingFromRadar(candidate),
    };
    event.dataTransfer.setData(LINEUP_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "copy";
  }

  function handleDragEnd(): void {
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  }

  function handleRowClick(candidate: RadarCandidate): void {
    if (draggedRef.current) return;
    onSelectCandidate(candidate);
  }

  const sorting = sortStatus.kind === "loading";
  const needHint =
    needPillar && needPillar.id === sortPillarId
      ? isHardLineupGap(needPillar)
        ? "lineup gap"
        : "softest pillar"
      : null;

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

      <div className={styles.sortRow}>
        <label className={styles.sortLabel} htmlFor={sortSelectId}>
          Sort by
        </label>
        <select
          id={sortSelectId}
          className={styles.sortSelect}
          value={sortPillarId}
          onChange={handlePillarChange}
          disabled={sorting}
          aria-label="Sort Radar shortlist by pillar"
          title={
            needHint
              ? `Defaults to ${PILLAR_LABELS[sortPillarId]} (${needHint}) from Lineup Fit`
              : "Reorder this shortlist by pillar percentile"
          }
        >
          {PILLAR_IDS.map((id) => {
            let suffix = "";
            if (needPillar && needPillar.id === id) {
              suffix = isHardLineupGap(needPillar)
                ? " — lineup gap"
                : " — softest";
            }
            return (
              <option key={id} value={id}>
                {PILLAR_LABELS[id]}
                {suffix}
              </option>
            );
          })}
        </select>
        <button
          type="button"
          className={styles.sortApply}
          onClick={() => {
            void sortByPillar(sortPillarId);
          }}
          disabled={sorting}
          aria-label={`Sort shortlist by ${PILLAR_LABELS[sortPillarId]}`}
          title={
            needHint
              ? `Sort by ${PILLAR_LABELS[sortPillarId]} (${needHint})`
              : `Sort by ${PILLAR_LABELS[sortPillarId]}`
          }
        >
          Sort
        </button>
      </div>

      {sortStatus.kind === "loading" ? (
        <p className={styles.sortNote} role="status">
          Ranking by {sortStatus.pillarLabel}…
        </p>
      ) : null}
      {sortStatus.kind === "sorted" ? (
        <p className={styles.sortNote} role="status">
          Sorted by {sortStatus.pillarLabel}
          {sortStatus.needKind === "gap"
            ? " (lineup gap)"
            : sortStatus.needKind === "softest"
              ? " (softest pillar)"
              : ""}
        </p>
      ) : null}
      {sortStatus.kind === "error" ? (
        <p className={styles.sortError} role="alert">
          {sortStatus.message}
        </p>
      ) : null}

      <ul
        ref={listRef}
        className={styles.list}
        tabIndex={0}
        aria-label="Radar candidates"
        data-just-sorted={justSorted ? "true" : "false"}
      >
        {picks.map((candidate) => {
          const pending = pendingCandidateId === candidate.id;
          const name = `${candidate.firstName} ${candidate.lastName}`;
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
                    <span className={styles.name}>{name}</span>
                    <span className={styles.meta}>
                      {candidate.teamAbbreviation} · {candidate.position}
                    </span>
                    <span className={styles.angle}>{candidate.angle}</span>
                  </span>
                </button>
                {onBeginPlace ? (
                  <button
                    type="button"
                    className={styles.swap}
                    onClick={() => onBeginPlace(candidate)}
                    aria-pressed={pending}
                    aria-label={`Swap ${name} onto a starter slot`}
                  >
                    <svg
                      className={styles.swapIcon}
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        d="M11.5 2.5 14 5l-2.5 2.5V6H6V4h5.5V2.5zm-7 11L2 11l2.5-2.5V10h5.5v2H4.5v1.5z"
                      />
                    </svg>
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
