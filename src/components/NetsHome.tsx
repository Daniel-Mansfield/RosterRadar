"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import dynamic from "next/dynamic";

import {
  rosterPlayerKey,
  type NetsRoster,
  type PlayerSummary,
  type RosterPlayer,
} from "@/domain/player";
import type { RadarCandidate } from "@/nba/radar/radarPool";
import { AcquisitionSearch } from "@/components/AcquisitionSearch";
import { DossierPanel } from "@/components/DossierPanel";
import { DossierSkeleton } from "@/components/DossierSkeleton";
import { HalfCourt } from "@/components/HalfCourt";
import { NetsMark } from "@/components/NetsMark";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerCard } from "@/components/PlayerCard";
import { TeamFitPanel } from "@/components/TeamFitPanel";
import {
  useDossierDrawer,
  type DrawerIdentity,
} from "@/components/useDossierDrawer";

import styles from "./NetsHome.module.css";

/**
 * Client-only: the radar shortlist is shuffled per page load, so its markup
 * is intentionally nondeterministic and must be excluded from SSR.
 */
const OnTheRadar = dynamic(
  () => import("@/components/OnTheRadar").then((mod) => mod.OnTheRadar),
  { ssr: false },
);

type NetsHomeProps = {
  roster: NetsRoster;
};

export function NetsHome({ roster }: NetsHomeProps): ReactElement {
  const {
    drawer,
    openDossier,
    showUnavailable,
    retryDossier,
    closeDrawer,
    drawerRef,
    closeButtonRef,
    titleId,
  } = useDossierDrawer();
  const [benchCanScrollMore, setBenchCanScrollMore] = useState(false);
  const benchListRef = useRef<HTMLUListElement>(null);
  const starterIds = roster.starters
    .map((player) => player.id)
    .filter((id): id is number => id != null);

  function updateBenchScrollHint(): void {
    const list = benchListRef.current;
    if (!list) {
      setBenchCanScrollMore(false);
      return;
    }
    const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
    setBenchCanScrollMore(list.scrollHeight > list.clientHeight + 2 && remaining > 8);
  }

  function openForRosterPlayer(player: RosterPlayer): void {
    const identity: DrawerIdentity = {
      title: `${player.firstName} ${player.lastName}`,
      subtitle: `${roster.teamName} · ${player.slot}${
        player.position ? ` · ${player.position}` : ""
      }`,
      firstName: player.firstName,
      lastName: player.lastName,
      playerId: player.id,
      espnAthleteId: player.espnAthleteId,
    };

    if (player.id == null) {
      showUnavailable(
        identity,
        "This Nets player does not have a resolved BALLDONTLIE id yet — dossier will unlock once the seed id is filled.",
      );
      return;
    }

    openDossier(identity);
  }

  function openForAcquisition(player: PlayerSummary): void {
    openDossier({
      title: `${player.firstName} ${player.lastName}`,
      subtitle: `Acquisition candidate · ${player.teamAbbreviation ?? "FA"}${
        player.position ? ` · ${player.position}` : ""
      }`,
      firstName: player.firstName,
      lastName: player.lastName,
      playerId: player.id,
      espnAthleteId: null,
    });
  }

  function openForRadarCandidate(candidate: RadarCandidate): void {
    openDossier({
      title: `${candidate.firstName} ${candidate.lastName}`,
      subtitle: `On the Radar · ${candidate.teamAbbreviation} · ${candidate.position}`,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      playerId: candidate.id,
      espnAthleteId: candidate.espnAthleteId,
    });
  }

  useEffect(() => {
    const list = benchListRef.current;
    if (!list) {
      return;
    }

    function measure(): void {
      updateBenchScrollHint();
    }

    measure();
    const raf = requestAnimationFrame(measure);
    list.addEventListener("scroll", measure, { passive: true });

    const observer = new ResizeObserver(measure);
    observer.observe(list);

    return () => {
      cancelAnimationFrame(raf);
      list.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [roster.bench.length]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <NetsMark className={styles.teamMark} size={56} />
          <div className={styles.brandBlock}>
            <h1 className={styles.brand}>
              <span className={styles.roster}>Roster</span>
              <span className={styles.radar}>Radar</span>
            </h1>
            <p className={styles.tagline}>
              Role-Aware Scouting for Brooklyn Nets Roster Decisions
            </p>
          </div>
        </div>
        <div className={styles.searchSlot}>
          <AcquisitionSearch onSelectPlayer={openForAcquisition} />
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.courtPane}>
          <HalfCourt
            starters={roster.starters}
            onSelectPlayer={openForRosterPlayer}
          />
        </div>

        {/* Directly after the court in stacked layouts (it scores the five
            shown there); leftmost column on wide screens. */}
        <div className={styles.teamFitPane}>
          <TeamFitPanel playerIds={starterIds} />
        </div>

        <aside className={styles.bench} aria-label="Bench">
          <h2 className={styles.benchTitle}>Bench</h2>
          <div className={styles.benchScroll}>
            <ul ref={benchListRef} className={styles.benchList}>
              {roster.bench.map((player) => (
                <li key={rosterPlayerKey(player)}>
                  <PlayerCard
                    player={player}
                    onSelect={openForRosterPlayer}
                    size="bench"
                  />
                </li>
              ))}
            </ul>
            {benchCanScrollMore ? (
              <div className={styles.benchScrollHint} aria-hidden="true">
                <span className={styles.benchScrollLabel}>More</span>
                <span className={styles.benchScrollChevron} />
              </div>
            ) : null}
          </div>
        </aside>

        {/* Last in DOM (stacked layouts show team first); column 1 on wide screens. */}
        <div className={styles.radarPane}>
          <OnTheRadar onSelectCandidate={openForRadarCandidate} />
        </div>
      </div>

      {drawer.open ? (
        <div className={styles.drawerRoot}>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close dossier drawer"
            onClick={closeDrawer}
          />
          <aside
            ref={drawerRef}
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className={styles.drawerHeader}>
              {/* Portrait lives in the dossier hero when ready; header avatar for loading/error. */}
              {drawer.dossier.status === "ready" ? (
                <div>
                  <h2 id={titleId} className={styles.drawerTitle}>
                    {drawer.title}
                  </h2>
                  <p className={styles.drawerSub}>{drawer.subtitle}</p>
                </div>
              ) : (
                <div className={styles.drawerIdentity}>
                  <PlayerAvatar
                    firstName={drawer.firstName}
                    lastName={drawer.lastName}
                    espnAthleteId={drawer.espnAthleteId}
                    size={48}
                    shape="rounded"
                  />
                  <div>
                    <h2 id={titleId} className={styles.drawerTitle}>
                      {drawer.title}
                    </h2>
                    <p className={styles.drawerSub}>{drawer.subtitle}</p>
                  </div>
                </div>
              )}
              <button
                ref={closeButtonRef}
                type="button"
                className={styles.close}
                onClick={closeDrawer}
              >
                Close
              </button>
            </div>
            <div className={styles.drawerBody}>
              {drawer.dossier.status === "loading" ? <DossierSkeleton /> : null}
              {drawer.dossier.status === "error" ||
              drawer.dossier.status === "unavailable" ? (
                <div className={styles.placeholder}>
                  {/* Alert on the message only: keeps the announcement clean
                      instead of reading the retry button label as part of it. */}
                  <p className={styles.placeholderMessage} role="alert">
                    {drawer.dossier.message}
                  </p>
                  {drawer.dossier.status === "error" ? (
                    <button
                      type="button"
                      className={styles.retry}
                      onClick={retryDossier}
                    >
                      Try again
                    </button>
                  ) : null}
                </div>
              ) : null}
              {drawer.dossier.status === "ready" ? (
                <DossierPanel
                  dossier={drawer.dossier.dossier}
                  espnAthleteId={drawer.espnAthleteId}
                />
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
