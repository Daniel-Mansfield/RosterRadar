import type { ReactElement } from "react";

import type { Dossier } from "@/domain/dossier";

import styles from "./DossierPanel.module.css";

type DossierPanelProps = {
  dossier: Dossier;
};

const FIT_LABEL: Record<Dossier["fit"]["recommendation"], string> = {
  strong: "Strong fit",
  conditional: "Conditional fit",
  poor: "Poor fit",
};

export function DossierPanel({ dossier }: DossierPanelProps): ReactElement {
  const strengths = dossier.callouts.filter((c) => c.kind === "strength");
  const risks = dossier.callouts.filter((c) => c.kind === "risk");

  return (
    <div className={styles.wrap}>
      <section className={styles.hero} aria-label="Fit verdict">
        <p className={styles.role}>{dossier.role.label}</p>
        <p className={`${styles.fit} ${styles[dossier.fit.recommendation]}`}>
          {FIT_LABEL[dossier.fit.recommendation]} · {dossier.fit.grade}
        </p>
        <p className={styles.verdict}>{dossier.fit.verdict}</p>
        <p className={styles.meta}>
          Confidence: {dossier.confidence.level} · {dossier.confidence.gamesPlayed}{" "}
          GP · {dossier.confidence.minutesPerGame} mpg · {dossier.season} season
        </p>
      </section>

      <section aria-label="Role pillars">
        <h3 className={styles.sectionTitle}>Role pillars</h3>
        <ul className={styles.pillars}>
          {dossier.pillars.map((pillar) => (
            <li key={pillar.id} className={styles.pillar}>
              <div className={styles.pillarHead}>
                <span>{pillar.label}</span>
                <span className={styles.pillarPct}>{pillar.percentile}</span>
              </div>
              <div
                className={styles.barTrack}
                role="meter"
                aria-valuenow={pillar.percentile}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${pillar.label} percentile`}
              >
                <div
                  className={styles.barFill}
                  style={{ width: `${pillar.percentile}%` }}
                />
              </div>
              <p className={styles.pillarRaw}>
                {pillar.raw} {pillar.unit}
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
              <li key={c.text}>{c.text}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={styles.sectionTitle}>Risks</h3>
          <ul className={styles.callouts}>
            {risks.map((c) => (
              <li key={c.text}>{c.text}</li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Evidence">
        <h3 className={styles.sectionTitle}>Evidence · L10 vs season</h3>
        <ul className={styles.evidence}>
          {dossier.evidence.map((row) => (
            <li key={row.id}>
              <span>{row.label}</span>
              <span>
                L10 {row.last10 ?? "—"} · Season {row.season} {row.unit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <details className={styles.method}>
        <summary>Methodology</summary>
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
