import type { ReactElement } from "react";

import styles from "./DossierSkeleton.module.css";

const PILLAR_ROWS = [0, 1, 2, 3, 4];

/**
 * Loading placeholder for the dossier drawer.
 *
 * Echoes DossierPanel's hero + pillars layout so the swap to real content
 * doesn't jump; the shimmer only animates when motion is allowed.
 */
export function DossierSkeleton(): ReactElement {
  return (
    <div className={styles.wrap} role="status">
      <span className={styles.srOnly}>Loading role-fit dossier…</span>

      <div className={styles.hero} aria-hidden="true">
        <div className={`${styles.bone} ${styles.portrait}`} />
        <div className={styles.heroCopy}>
          <div className={`${styles.bone} ${styles.roleLine}`} />
          <div className={styles.scoreRow}>
            <div className={`${styles.bone} ${styles.grade}`} />
            <div className={styles.scoreMeta}>
              <div className={`${styles.bone} ${styles.badge}`} />
              <div className={`${styles.bone} ${styles.metaLine}`} />
            </div>
          </div>
          <div className={`${styles.bone} ${styles.verdictLine}`} />
        </div>
      </div>

      <div className={styles.pillars} aria-hidden="true">
        {PILLAR_ROWS.map((row) => (
          <div key={row} className={styles.pillar}>
            <div className={styles.pillarHead}>
              <div className={`${styles.bone} ${styles.pillarLabel}`} />
              <div className={`${styles.bone} ${styles.pillarPct}`} />
            </div>
            <div className={`${styles.bone} ${styles.bar}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
