"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from "react";

import type { FitRecommendation, PillarId } from "@/domain/dossier";
import type { LineupSimSummaryLine } from "@/domain/lineupSim";
import type { TeamFit } from "@/domain/teamFit";
import { LINEUP_SIZE } from "@/domain/teamFit";
import { apiErrorSchema } from "@/lib/api/schemas";
import { teamFitApiResponseSchema } from "@/lib/api/teamFitSchema";
import { percentileBarTone } from "@/lib/ui/percentileBar";

import styles from "./TeamFitPanel.module.css";

type TeamFitPanelProps = {
  /** Resolved BALLDONTLIE ids for the starting five (real or simulated). */
  playerIds: number[];
  /** Real-lineup Fit used for deltas while simulating. */
  baseline?: TeamFit | null;
  isSimulating?: boolean;
  /** Stacked change lines under the subtitle while simulating (PG→C). */
  simSummaryLines?: LineupSimSummaryLine[];
  onReset?: () => void;
};

type PanelState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; teamFit: TeamFit };

const FIT_LABEL = {
  strong: "Strong lineup",
  conditional: "Conditional lineup",
  poor: "Poor lineup",
} as const satisfies Record<FitRecommendation, string>;

/** CSS-module class names are typed as possibly undefined under strict index access. */
function requireClass(value: string | undefined, name: string): string {
  if (value == null || value === "") {
    throw new Error(`Missing CSS module class: ${name}`);
  }
  return value;
}

const FIT_CLASS = {
  strong: requireClass(styles.strong, "strong"),
  conditional: requireClass(styles.conditional, "conditional"),
  poor: requireClass(styles.poor, "poor"),
} as const satisfies Record<FitRecommendation, string>;

function barTone(percentile: number): string {
  const tone = percentileBarTone(percentile);
  if (tone === "strong") return requireClass(styles.barStrong, "barStrong");
  if (tone === "poor") return requireClass(styles.barPoor, "barPoor");
  return requireClass(styles.barMid, "barMid");
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function deltaClass(delta: number): string {
  if (delta > 0) return requireClass(styles.deltaUp, "deltaUp");
  if (delta < 0) return requireClass(styles.deltaDown, "deltaDown");
  return requireClass(styles.deltaFlat, "deltaFlat");
}

function baselinePillarMap(baseline: TeamFit): Map<PillarId, number> {
  return new Map(baseline.pillars.map((p) => [p.id, p.percentile]));
}

async function fetchTeamFit(idsKey: string): Promise<PanelState> {
  try {
    const response = await fetch(`/api/team-fit?ids=${idsKey}`);
    const json: unknown = await response.json();

    if (!response.ok) {
      const err = apiErrorSchema.safeParse(json);
      return {
        status: "error",
        message: err.success
          ? err.data.error.message
          : "Could not load lineup fit.",
      };
    }

    const parsed = teamFitApiResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Lineup fit response failed validation.",
      };
    }

    return { status: "ready", teamFit: parsed.data.teamFit };
  } catch {
    return { status: "error", message: "Could not reach lineup fit API." };
  }
}

/**
 * Lineup-level fit read for the starting five: grade, per-pillar averages,
 * balance callouts, and a thin-sample confidence line.
 *
 * Empty / partial starter ids are handled here (no fetch) so the panel never
 * silently scores a subset as a "starting five." The live loader is keyed on
 * the id list — a props change (swap) remounts it into loading without a
 * set-state-in-effect dance. Optional baseline shows aggregation deltas only.
 */
export function TeamFitPanel({
  playerIds,
  baseline = null,
  isSimulating = false,
  simSummaryLines = [],
  onReset,
}: TeamFitPanelProps): ReactElement {
  const headingId = useId();
  // Programmatic focus target for retry (not in tab order).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const idsKey = playerIds.join(",");

  let body: ReactElement;
  if (playerIds.length === 0) {
    body = (
      <UnavailableMessage message="No starters have a resolved BALLDONTLIE id yet — lineup fit unlocks once the seed ids are filled." />
    );
  } else if (playerIds.length !== LINEUP_SIZE) {
    body = (
      <UnavailableMessage
        message={`Lineup fit needs all ${LINEUP_SIZE} starters resolved (${playerIds.length} of ${LINEUP_SIZE} available).`}
      />
    );
  } else {
    body = (
      <TeamFitPanelLive
        key={idsKey}
        idsKey={idsKey}
        headingRef={headingRef}
        baseline={isSimulating ? baseline : null}
      />
    );
  }

  return (
    <section
      className={styles.panel}
      aria-labelledby={headingId}
      data-tour="team-fit"
    >
      <h2
        ref={headingRef}
        id={headingId}
        className={styles.title}
        tabIndex={-1}
      >
        Lineup Fit
      </h2>
      <p className={styles.subtitle}>
        {isSimulating
          ? "Hypothetical starting five vs league peers"
          : "Starting five vs league peers"}
      </p>
      {isSimulating && simSummaryLines.length > 0 ? (
        <div className={styles.simBanner}>
          <div role="status">
            <ul className={styles.simSummaryList}>
              {simSummaryLines.map((line) => (
                <li key={line.slot} className={styles.simSummary}>
                  {line.text}
                </li>
              ))}
            </ul>
            <p className={styles.simCaveat}>
              Peer aggregation, not synergy
            </p>
          </div>
          {onReset ? (
            <button
              type="button"
              className={styles.reset}
              onClick={onReset}
              data-tour="reset-lineup"
            >
              Reset lineup
            </button>
          ) : null}
        </div>
      ) : null}
      {body}
    </section>
  );
}

type LiveProps = {
  idsKey: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  baseline: TeamFit | null;
};

function TeamFitPanelLive({
  idsKey,
  headingRef,
  baseline,
}: LiveProps): ReactElement {
  const [state, setState] = useState<PanelState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void fetchTeamFit(idsKey).then((next) => {
      if (!cancelled) {
        setState(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [idsKey, attempt]);

  function retry(): void {
    headingRef.current?.focus();
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  if (state.status === "loading") {
    return <PanelSkeleton />;
  }

  if (state.status === "error") {
    return (
      <div className={styles.placeholder}>
        <p className={styles.placeholderMessage} role="alert">
          {state.message}
        </p>
        <button type="button" className={styles.retry} onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  return <PanelBody teamFit={state.teamFit} baseline={baseline} />;
}

function UnavailableMessage({ message }: { message: string }): ReactElement {
  return (
    <div className={styles.placeholder}>
      <p className={styles.placeholderMessage} role="status">
        {message}
      </p>
    </div>
  );
}

function PanelBody({
  teamFit,
  baseline,
}: {
  teamFit: TeamFit;
  baseline: TeamFit | null;
}): ReactElement {
  const fitClass = FIT_CLASS[teamFit.recommendation];
  const fitLabel = FIT_LABEL[teamFit.recommendation];
  const gradeDelta =
    baseline != null ? teamFit.grade - baseline.grade : null;
  const basePillars = baseline != null ? baselinePillarMap(baseline) : null;

  const scoreAria =
    gradeDelta != null
      ? `${fitLabel}, lineup grade ${teamFit.grade}, ${formatDelta(gradeDelta)} vs real lineup`
      : `${fitLabel}, lineup grade ${teamFit.grade}`;

  return (
    <div className={`${styles.body} ${styles.contentEnter}`}>
      <div className={styles.scoreboard} aria-label={scoreAria}>
        <p className={`${styles.grade} ${fitClass}`} aria-hidden="true">
          {teamFit.grade}
        </p>
        <div className={styles.scoreMeta}>
          <p className={`${styles.fitBadge} ${fitClass}`}>{fitLabel}</p>
          {gradeDelta != null ? (
            <p className={`${styles.gradeDelta} ${deltaClass(gradeDelta)}`}>
              {formatDelta(gradeDelta)} vs real
            </p>
          ) : (
            <p className={styles.season}>{teamFit.season} season</p>
          )}
        </div>
      </div>

      <ul className={styles.pillars}>
        {teamFit.pillars.map((pillar) => {
          const basePct = basePillars?.get(pillar.id);
          const pillarDelta =
            basePct != null ? pillar.percentile - basePct : null;
          return (
            <li key={pillar.id} className={styles.pillar}>
              <div className={styles.pillarHead}>
                <span className={styles.pillarLabel}>{pillar.label}</span>
                <span className={styles.pillarPctRow}>
                  <span className={styles.pillarPct}>{pillar.percentile}</span>
                  {pillarDelta != null ? (
                    <span
                      className={`${styles.pillarDelta} ${deltaClass(pillarDelta)}`}
                    >
                      {formatDelta(pillarDelta)}
                    </span>
                  ) : null}
                </span>
              </div>
              <div
                className={styles.barTrack}
                role="meter"
                aria-valuenow={pillar.percentile}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={
                  pillarDelta != null
                    ? `${pillar.label} lineup percentile ${pillar.percentile}, ${formatDelta(pillarDelta)} vs real`
                    : `${pillar.label} lineup percentile ${pillar.percentile}`
                }
              >
                <div
                  className={`${styles.barFill} ${barTone(pillar.percentile)}`}
                  style={{ width: `${pillar.percentile}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {teamFit.callouts.length > 0 ? (
        <ul className={styles.callouts}>
          {teamFit.callouts.map((callout) => (
            <li
              key={callout.text}
              className={
                callout.kind === "strength"
                  ? styles.calloutStrength
                  : styles.calloutRisk
              }
            >
              {callout.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.balanced}>
          No standout strengths or gaps — a balanced lineup on paper.
        </p>
      )}

      {teamFit.confidence.anyThinSample ? (
        <p className={styles.thinNote}>
          Thin sample: {teamFit.confidence.thinSampleNames.join(", ")} —
          preliminary read.
        </p>
      ) : null}

      <details
        className={styles.method}
        onToggle={(event) => {
          const el = event.currentTarget;
          if (!el.open) return;
          const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          requestAnimationFrame(() => {
            el.scrollIntoView({
              block: "end",
              behavior: reduceMotion ? "auto" : "smooth",
            });
          });
        }}
      >
        <summary>How this is scored</summary>
        <ul>
          {teamFit.methodology.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          {baseline != null ? (
            <li>
              Deltas compare this hypothetical lineup’s pillar averages to the
              real starting five — still peer aggregation, not on-court synergy.
            </li>
          ) : null}
        </ul>
      </details>
    </div>
  );
}

function PanelSkeleton(): ReactElement {
  return (
    <div className={styles.body} role="status">
      <span className={styles.srOnly}>Loading lineup fit…</span>
      <div className={styles.scoreboard} aria-hidden="true">
        <span className={`${styles.bone} ${styles.boneGrade}`} />
        <span className={`${styles.bone} ${styles.boneBadge}`} />
      </div>
      <ul className={styles.pillars} aria-hidden="true">
        {[
          "scoring",
          "playmaking",
          "rebounding",
          "spacing",
          "disruption",
          "workload",
        ].map((id) => (
          <li key={id} className={styles.pillar}>
            <span className={`${styles.bone} ${styles.boneLabel}`} />
            <span className={`${styles.bone} ${styles.boneBar}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
