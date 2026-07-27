"use client";

import { useState, type ReactElement } from "react";

import type { NetsRoster, PlayerSummary, RosterPlayer } from "@/domain/player";
import { AcquisitionSearch } from "@/components/AcquisitionSearch";
import { HalfCourt } from "@/components/HalfCourt";
import { PlayerCard } from "@/components/PlayerCard";

import styles from "./NetsHome.module.css";

type NetsHomeProps = {
  roster: NetsRoster;
};

type DrawerState =
  | { open: false }
  | {
      open: true;
      title: string;
      subtitle: string;
    };

export function NetsHome({ roster }: NetsHomeProps): ReactElement {
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });

  function openForRosterPlayer(player: RosterPlayer): void {
    setDrawer({
      open: true,
      title: `${player.firstName} ${player.lastName}`,
      subtitle: `${roster.teamName} · ${player.slot}${
        player.position ? ` · ${player.position}` : ""
      }`,
    });
  }

  function openForAcquisition(player: PlayerSummary): void {
    setDrawer({
      open: true,
      title: `${player.firstName} ${player.lastName}`,
      subtitle: `Acquisition candidate · ${player.teamAbbreviation ?? "FA"}${
        player.position ? ` · ${player.position}` : ""
      }`,
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.brand}>
          <span className={styles.roster}>Roster</span>
          <span className={styles.radar}>Radar</span>
        </h1>
        <p className={styles.teamLine}>{roster.teamName}</p>
      </header>

      <AcquisitionSearch onSelectPlayer={openForAcquisition} />

      <div className={styles.main}>
        <HalfCourt
          starters={roster.starters}
          onSelectPlayer={openForRosterPlayer}
        />

        <aside className={styles.bench} aria-label="Bench">
          <h2 className={styles.benchTitle}>Bench</h2>
          <ul className={styles.benchList}>
            {roster.bench.map((player) => (
              <li key={player.id}>
                <PlayerCard player={player} onSelect={openForRosterPlayer} />
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {drawer.open ? (
        <div className={styles.drawerRoot}>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close dossier drawer"
            onClick={() => setDrawer({ open: false })}
          />
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dossier-title"
          >
            <div className={styles.drawerHeader}>
              <div>
                <h2 id="dossier-title" className={styles.drawerTitle}>
                  {drawer.title}
                </h2>
                <p className={styles.drawerSub}>{drawer.subtitle}</p>
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={() => setDrawer({ open: false })}
              >
                Close
              </button>
            </div>
            <div className={styles.drawerBody}>
              <p className={styles.placeholder}>
                Role-fit dossier comes next — verdict, pillars, strengths and
                risks will land here.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
