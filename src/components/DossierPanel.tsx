import type { ReactElement } from "react";

import type { Dossier } from "@/domain/dossier";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { percentileBarTone } from "@/lib/ui/percentileBar";

import styles from "./DossierPanel.module.css";

type DossierPanelProps = {
  dossier: Dossier;
  /** Curated ESPN id when opening from Nets roster; null for acquisition search. */
  espnAthleteId?: number | null;
};

const FIT_LABEL = {
  strong: "Strong fit",
  conditional: "Conditional fit",
  poor: "Poor fit",
} as const satisfies Record<Dossier["fit"]["recommendation"], string>;

/** CSS-module class names are typed as possibly undefined under strict index access. */
function requireClass(
  value: string | undefined,
  name: string,
): string {
  if (value == null || value === "") {
    throw new Error(`Missing CSS module class: ${name}`);
  }
  return value;
}

const FIT_CLASS = {
  strong: requireClass(styles.strong, "strong"),
  conditional: requireClass(styles.conditional, "conditional"),
  poor: requireClass(styles.poor, "poor"),
} as const satisfies Record<Dossier["fit"]["recommendation"], string>;

function barTone(percentile: number): string {
  const tone = percentileBarTone(percentile);
  if (tone === "strong") return requireClass(styles.barStrong, "barStrong");
  if (tone === "poor") return requireClass(styles.barPoor, "barPoor");
  return requireClass(styles.barMid, "barMid");
}

export function DossierPanel({
  dossier,
  espnAthleteId = null,
}: DossierPanelProps): ReactElement {
  const strengths = dossier.callouts.filter((c) => c.kind === "strength");
  const risks = dossier.callouts.filter((c) => c.kind === "risk");
  const fitClass = FIT_CLASS[dossier.fit.recommendation];
  const fitLabel = FIT_LABEL[dossier.fit.recommendation];

  return (
    <div className={styles.wrap}>
      <section className={styles.hero} aria-label="Fit verdict">
        <div className={styles.heroTop}>
          <div className={styles.heroPortrait}>
            <PlayerAvatar
              firstName={dossier.player.firstName}
              lastName={dossier.player.lastName}
              espnAthleteId={espnAthleteId}
              fill
              shape="rounded"
            />
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.role}>{dossier.role.label}</p>
            <div
              className={styles.scoreboard}
              aria-label={`${fitLabel}, grade ${dossier.fit.grade}`}
            >
              <p className={`${styles.grade} ${fitClass}`} aria-hidden="true">
                {dossier.fit.grade}
              </p>
              <div className={styles.scoreMeta}>
                <p className={`${styles.fitBadge} ${fitClass}`}>{fitLabel}</p>
                <p className={styles.meta}>
                  Confidence: {dossier.confidence.level}
                  {dossier.confidence.thinSample ? " · thin sample" : ""} ·{" "}
                  {dossier.confidence.gamesPlayed} GP ·{" "}
                  {dossier.confidence.minutesPerGame} mpg · {dossier.season}
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className={styles.verdict}>{dossier.fit.verdict}</p>
      </section>

      <section aria-label="Role pillars">
        <h3 className={styles.sectionTitle}>Role pillars</h3>
        <ul className={styles.pillars}>
          {dossier.pillars.map((pillar) => (
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
                aria-label={`${pillar.label} percentile ${pillar.percentile}`}
              >
                <div
                  className={`${styles.barFill} ${barTone(pillar.percentile)}`}
                  style={{ width: `${pillar.percentile}%` }}
                />
              </div>
              <p className={styles.pillarRaw}>
                {pillar.raw} {pillar.unit}
                <span className={styles.peerHint}> · peer percentile</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.split} aria-label="Strengths and risks">
        <div>
          <h3 className={styles.sectionTitle}>Strengths</h3>
          <ul className={styles.callouts}>
            {strengths.map((c) => (
              <li key={c.text} className={styles.calloutStrength}>
                {c.text}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={styles.sectionTitle}>Risks</h3>
          <ul className={styles.callouts}>
            {risks.map((c) => (
              <li key={c.text} className={styles.calloutRisk}>
                {c.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Evidence">
        <h3 className={styles.sectionTitle}>Evidence · L10 vs season</h3>
        <table className={styles.evidenceTable}>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">L10</th>
              <th scope="col">Season</th>
            </tr>
          </thead>
          <tbody>
            {dossier.evidence.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                <td>{row.last10 ?? "—"}</td>
                <td>
                  {row.season}
                  <span className={styles.evidenceUnit}> {row.unit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <details className={styles.method}>
        <summary>How this is scored</summary>
        <p>
          Scoring version {dossier.methodology.scoringVersion}. Peer pool size{" "}
          {dossier.methodology.peerPoolSize}. Games under{" "}
          {dossier.methodology.minMinutesForGame} minutes excluded from L10.
        </p>
        <ul>
          {dossier.methodology.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
