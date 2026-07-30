"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from "react";

import type { FitRecommendation } from "@/domain/dossier";
import type { TeamFit } from "@/domain/teamFit";
import { LINEUP_SIZE } from "@/domain/teamFit";
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
 * Empty / partial starter ids are handled here (no fetch) so the panel never
 * silently scores a subset as a "starting five." The live loader is keyed on
 * the id list — a props change (PR 2 swap) remounts it into loading without a
 * set-state-in-effect dance.
 */
export function TeamFitPanel({ playerIds }: TeamFitPanelProps): ReactElement {
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
    // key remounts the loader when the lineup changes → fresh loading state.
    body = (
      <TeamFitPanelLive
        key={idsKey}
        idsKey={idsKey}
        headingRef={headingRef}
      />
    );
  }

  return (
    <section className={styles.panel} aria-labelledby={headingId}>
      <h2
        ref={headingRef}
        id={headingId}
        className={styles.title}
        tabIndex={-1}
      >
        Lineup Fit
      </h2>
      <p className={styles.subtitle}>Starting five vs league peers</p>
      {body}
    </section>
  );
}

type LiveProps = {
  idsKey: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

function TeamFitPanelLive({ idsKey, headingRef }: LiveProps): ReactElement {
  const [state, setState] = useState<PanelState>({ status: "loading" });
  // Bumped by retry to re-run the fetch effect for the same ids.
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
    // Retry button unmounts on the loading transition; park focus on the
    // stable heading so keyboard focus doesn't drop to <body>.
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
        {/* Alert on the message only: keeps the announcement clean instead of
            reading the retry button label as part of it. */}
        <p className={styles.placeholderMessage} role="alert">
          {state.message}
        </p>
        <button type="button" className={styles.retry} onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  return <PanelBody teamFit={state.teamFit} />;
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

      <details
        className={styles.method}
        onToggle={(event) => {
          const el = event.currentTarget;
          if (!el.open) return;
          // After layout, land the notes in the panel scrollport (end so the
          // last bullet clears the fold instead of only the summary).
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
