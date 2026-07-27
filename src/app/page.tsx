import type { ReactElement } from "react";

import { AppError } from "@/domain/errors";
import type { NetsRoster } from "@/domain/player";
import { NetsHome } from "@/components/NetsHome";
import { loadNetsRoster } from "@/nba/loadNetsRoster";

import styles from "./page.module.css";

export default async function Home(): Promise<ReactElement> {
  const rosterResult = await loadHomeRoster();

  if (!rosterResult.ok) {
    return (
      <div className={styles.shell}>
        <h1 className={styles.brandFallback}>
          <span className={styles.roster}>Roster</span>
          <span className={styles.radar}>Radar</span>
        </h1>
        <p className={styles.err} role="alert">
          {rosterResult.code}: {rosterResult.message}
        </p>
      </div>
    );
  }

  return <NetsHome roster={rosterResult.roster} />;
}

type RosterResult =
  | { ok: true; roster: NetsRoster }
  | { ok: false; code: string; message: string };

async function loadHomeRoster(): Promise<RosterResult> {
  try {
    const roster = await loadNetsRoster();
    return { ok: true, roster };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, code: error.code, message: error.message };
    }
    return {
      ok: false,
      code: "upstream",
      message: "Could not load Brooklyn Nets roster.",
    };
  }
}
