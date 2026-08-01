"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import dynamic from "next/dynamic";

import {
  rosterPlayerKey,
  type NetsRoster,
  type PlayerSummary,
  type RosterPlayer,
} from "@/domain/player";
import {
  isStarterSlot,
  lineupIncomingFromBench,
  starterIdsFromPlayers,
  type LineupDragPayload,
  type StarterSlot,
} from "@/domain/lineupSim";
import type { TeamFit } from "@/domain/teamFit";
import { LINEUP_SIZE } from "@/domain/teamFit";
import type { RadarCandidate } from "@/nba/radar/radarPool";
import { teamFitApiResponseSchema } from "@/lib/api/teamFitSchema";
import { AcquisitionSearch } from "@/components/AcquisitionSearch";
import { DossierPanel } from "@/components/DossierPanel";
import { DossierSkeleton } from "@/components/DossierSkeleton";
import { HalfCourt } from "@/components/HalfCourt";
import { NetsMark } from "@/components/NetsMark";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerCard } from "@/components/PlayerCard";
import { SpotlightTour } from "@/components/SpotlightTour";
import { TeamFitPanel } from "@/components/TeamFitPanel";
import {
  useDossierDrawer,
  type DrawerIdentity,
} from "@/components/useDossierDrawer";
import { useLineupSim } from "@/components/useLineupSim";

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
  const [tourOpen, setTourOpen] = useState(false);
  const benchListRef = useRef<HTMLUListElement>(null);

  const {
    sim,
    displayStarters,
    displayBench,
    displacedPlayerId,
    displayStarterIds,
    isSimulating,
    pendingIncoming,
    beginPendingRadar,
    beginPendingBench,
    cancelPendingSwap,
    applySwap,
    placeOnSlot,
    reset,
  } = useLineupSim(roster.starters, roster.bench);

  const realStarterIds = useMemo(
    () => starterIdsFromPlayers(roster.starters),
    [roster.starters],
  );
  const realIdsKey = realStarterIds.join(",");

  const [baselineFit, setBaselineFit] = useState<TeamFit | null>(null);

  // Load once for the real five; deltas compare sim Fit against this snapshot.
  // Do not sync-clear in the effect body (cascading render lint) — gate on length when passing.
  useEffect(() => {
    if (realStarterIds.length !== LINEUP_SIZE) {
      return;
    }

    let cancelled = false;
    void fetch(`/api/team-fit?ids=${realIdsKey}`)
      .then((response) => response.json())
      .then((json: unknown) => {
        if (cancelled) return;
        const parsed = teamFitApiResponseSchema.safeParse(json);
        setBaselineFit(parsed.success ? parsed.data.teamFit : null);
      })
      .catch(() => {
        if (!cancelled) setBaselineFit(null);
      });

    return () => {
      cancelled = true;
    };
  }, [realIdsKey, realStarterIds.length]);

  const baselineForPanel =
    realStarterIds.length === LINEUP_SIZE ? baselineFit : null;

  useEffect(() => {
    if (!pendingIncoming) return;

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        cancelPendingSwap();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingIncoming, cancelPendingSwap]);

  const simSummary = useMemo(() => {
    if (sim.status !== "simulating") return null;
    const outgoing = roster.starters.find((p) => p.slot === sim.swap.slot);
    const outName = outgoing
      ? `${outgoing.firstName} ${outgoing.lastName}`
      : sim.swap.slot;
    const inName = `${sim.swap.incoming.firstName} ${sim.swap.incoming.lastName}`;
    return `${inName} in for ${outName} (${sim.swap.slot}) — peer aggregation, not synergy`;
  }, [sim, roster.starters]);

  function updateBenchScrollHint(): void {
    const list = benchListRef.current;
    if (!list) {
      setBenchCanScrollMore(false);
      return;
    }
    const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
    setBenchCanScrollMore(
      list.scrollHeight > list.clientHeight + 2 && remaining > 8,
    );
  }

  function openForRosterPlayer(player: RosterPlayer): void {
    // Place mode always targets the real starter in that slot (not a prior sim).
    if (pendingIncoming && isStarterSlot(player.slot)) {
      const real = roster.starters.find((p) => p.slot === player.slot);
      if (real && real.id != null) {
        placeOnSlot(player.slot, real);
        return;
      }
    }

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
      radarAngle: candidate.angle,
    });
  }

  function handleLineupDrop(slot: StarterSlot, payload: LineupDragPayload): void {
    const starter = roster.starters.find((p) => p.slot === slot);
    if (!starter || starter.id == null) return;
    applySwap({
      slot,
      outgoingId: starter.id,
      incoming: payload.incoming,
      source: payload.source,
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
  }, [displayBench.length]);

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
        <div className={styles.searchSlot} data-tour="search">
          <AcquisitionSearch onSelectPlayer={openForAcquisition} />
        </div>
        <div className={styles.tourSlot}>
          <button
            type="button"
            className={styles.tourButton}
            onClick={() => setTourOpen(true)}
          >
            Tutorial
          </button>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.courtPane}>
          <HalfCourt
            starters={displayStarters}
            onSelectPlayer={openForRosterPlayer}
            onLineupDrop={handleLineupDrop}
            dropArmed={pendingIncoming != null}
          />
        </div>

        <div className={styles.teamFitPane}>
          <TeamFitPanel
            playerIds={displayStarterIds}
            baseline={baselineForPanel}
            isSimulating={isSimulating}
            simSummary={simSummary}
            onReset={reset}
          />
        </div>

        <aside className={styles.bench} aria-label="Bench" data-tour="bench">
          <h2 className={styles.benchTitle}>Bench</h2>
          <div className={styles.benchScroll}>
            <ul ref={benchListRef} className={styles.benchList}>
              {displayBench.map((player, index) => {
                const isDisplacedOut =
                  displacedPlayerId != null &&
                  player.id === displacedPlayerId &&
                  index === 0;
                const canSwap =
                  !isDisplacedOut && lineupIncomingFromBench(player) != null;
                const pending =
                  pendingIncoming?.source === "bench" &&
                  pendingIncoming.incoming.id === player.id;
                const name = `${player.firstName} ${player.lastName}`;

                return (
                  <li
                    key={
                      isDisplacedOut
                        ? `displaced:${player.id}`
                        : rosterPlayerKey(player)
                    }
                    className={styles.benchItem}
                  >
                    <div
                      className={`${styles.benchRow} ${pending ? styles.benchRowPending : ""}`}
                    >
                      {canSwap ? (
                        <button
                          type="button"
                          className={styles.benchSwap}
                          onClick={() => beginPendingBench(player)}
                          aria-pressed={pending}
                          aria-label={`Swap ${name} onto a starter slot`}
                        >
                          <svg
                            className={styles.benchSwapIcon}
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
                      <PlayerCard
                        player={player}
                        onSelect={openForRosterPlayer}
                        size="bench"
                        outOfLineup={isDisplacedOut}
                        draggableToCourt={canSwap}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {benchCanScrollMore ? (
              <div className={styles.benchScrollHint} aria-hidden="true">
                <span className={styles.benchScrollLabel}>More</span>
                <span className={styles.benchScrollChevron} />
              </div>
            ) : null}
          </div>
        </aside>

        <div className={styles.radarPane}>
          <OnTheRadar
            onSelectCandidate={openForRadarCandidate}
            onBeginPlace={beginPendingRadar}
            pendingCandidateId={
              pendingIncoming?.source === "radar"
                ? pendingIncoming.incoming.id
                : null
            }
          />
        </div>
      </div>

      {/* Remount on each open so the tour always starts at step 1. */}
      {tourOpen ? (
        <SpotlightTour open onClose={() => setTourOpen(false)} />
      ) : null}

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
              {drawer.dossier.status === "ready" ? (
                <div>
                  <h2 id={titleId} className={styles.drawerTitle}>
                    {drawer.title}
                  </h2>
                  <p className={styles.drawerSub}>{drawer.subtitle}</p>
                  {drawer.radarAngle ? (
                    <p className={styles.radarAngle}>{drawer.radarAngle}</p>
                  ) : null}
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
                    {drawer.radarAngle ? (
                      <p className={styles.radarAngle}>{drawer.radarAngle}</p>
                    ) : null}
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
