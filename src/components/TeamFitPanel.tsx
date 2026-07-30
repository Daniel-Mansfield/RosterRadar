"use client";

import { useEffect, useId, useState, type ReactElement } from "react";

import type { FitRecommendation } from "@/domain/dossier";
import type { TeamFit } from "@/domain/teamFit";
import { apiErrorSchema } from "@/lib/api/schemas";
import { teamFitApiResponseSchema } from "@/lib/api/teamFitSchema";

import styles from "./TeamFitPanel.module.css";

type TeamFitPanelProps = {
  /** Resolved BALLDONTLIE ids for the starting five. */
  playerIds: number[];
};

type PanelState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; teamFit: TeamFit };

const FIT_LABEL = {
  strong: "Strong lineup",
  conditional: "Conditional",
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
  if (percentile >= 70) return requireClass(styles.barStrong, "barStrong");
  if (percentile <= 35) return requireClass(styles.barPoor, "barPoor");
  return requireClass(styles.barMid, "barMid");
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
 * Mirrors the dossier drawer's load/error/retry contract; the fetch keys on
 * the id list, so a future lineup swap (PR 2) is just a props change.
 */
export function TeamFitPanel({ playerIds }: TeamFitPanelProps): ReactElement {
  const [state, setState] = useState<PanelState>({ status: "loading" });
  // Bumped by retry to re-run the fetch effect for the same ids.
  const [attempt, setAttempt] = useState(0);
  const headingId = useId();
  const idsKey = playerIds.join(",");

  useEffect(() => {
    if (idsKey === "") {
      return;
    }
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
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  return (
    <section className={styles.panel} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.title}>
        Lineup Fit
      </h2>
      <p className={styles.subtitle}>Starting five vs league peers</p>

      {state.status === "loading" ? <PanelSkeleton /> : null}

      {state.status === "error" ? (
        <div className={styles.placeholder}>
          <p className={styles.placeholderMessage} role="alert">
            {state.message}
          </p>
          <button type="button" className={styles.retry} onClick={retry}>
            Try again
          </button>
        </div>
      ) : null}

      {state.status === "ready" ? <PanelBody teamFit={state.teamFit} /> : null}
    </section>
  );
}

function PanelBody({ teamFit }: { teamFit: TeamFit }): ReactElement {
  const fitClass = FIT_CLASS[teamFit.recommendation];
  const fitLabel = FIT_LABEL[teamFit.recommendation];

  return (
    <div className={styles.body}>
      <div
        className={styles.scoreboard}
        aria-label={`${fitLabel}, lineup grade ${teamFit.grade}`}
      >
        <p className={`${styles.grade} ${fitClass}`} aria-hidden="true">
          {teamFit.grade}
        </p>
        <div className={styles.scoreMeta}>
          <p className={`${styles.fitBadge} ${fitClass}`}>{fitLabel}</p>
          <p className={styles.season}>{teamFit.season} season</p>
        </div>
      </div>

      <ul className={styles.pillars}>
        {teamFit.pillars.map((pillar) => (
          <li key={pillar.id} className={styles.pillar}>
            <div className={styles.pillarHead}>
              <span className={styles.pillarLabel}>{pillar.label}</span>
              <span className={styles.pillarPct}>{pillar.percentile}</span>
            </div>
            <div
              className={styles.barTrack}
              role="meter"
              aria-valuenow={pillar.percentile}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${pillar.label} lineup percentile ${pillar.percentile}`}
            >
              <div
                className={`${styles.barFill} ${barTone(pillar.percentile)}`}
                style={{ width: `${pillar.percentile}%` }}
              />
            </div>
          </li>
        ))}
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

      <details className={styles.method}>
        <summary>How this is scored</summary>
        <ul>
          {teamFit.methodology.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function PanelSkeleton(): ReactElement {
  return (
    <div className={styles.body} aria-hidden="true">
      <div className={styles.scoreboard}>
        <span className={`${styles.bone} ${styles.boneGrade}`} />
        <span className={`${styles.bone} ${styles.boneBadge}`} />
      </div>
      <ul className={styles.pillars}>
        {["scoring", "playmaking", "rebounding", "spacing", "disruption", "workload"].map(
          (id) => (
            <li key={id} className={styles.pillar}>
              <span className={`${styles.bone} ${styles.boneLabel}`} />
              <span className={`${styles.bone} ${styles.boneBar}`} />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
