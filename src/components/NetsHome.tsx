"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from "react";

import type { Dossier } from "@/domain/dossier";
import {
  rosterPlayerKey,
  type NetsRoster,
  type PlayerSummary,
  type RosterPlayer,
} from "@/domain/player";
import { AcquisitionSearch } from "@/components/AcquisitionSearch";
import { DossierPanel } from "@/components/DossierPanel";
import { HalfCourt } from "@/components/HalfCourt";
import { NetsMark } from "@/components/NetsMark";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerCard } from "@/components/PlayerCard";
import { apiErrorSchema } from "@/lib/api/schemas";
import { dossierApiResponseSchema } from "@/lib/api/dossierSchema";

import styles from "./NetsHome.module.css";

type NetsHomeProps = {
  roster: NetsRoster;
};

type DrawerIdentity = {
  title: string;
  subtitle: string;
  firstName: string;
  lastName: string;
  playerId: number | null;
  /** Curated ESPN headshot id when known (Nets seed); null for search. */
  espnAthleteId: number | null;
};

type DossierLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; dossier: Dossier }
  | { status: "unavailable"; message: string };

type DrawerState =
  | { open: false }
  | ({ open: true } & DrawerIdentity & { dossier: DossierLoadState });

export function NetsHome({ roster }: NetsHomeProps): ReactElement {
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [benchCanScrollMore, setBenchCanScrollMore] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const benchListRef = useRef<HTMLUListElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const requestIdRef = useRef(0);

  function updateBenchScrollHint(): void {
    const list = benchListRef.current;
    if (!list) {
      setBenchCanScrollMore(false);
      return;
    }
    const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
    setBenchCanScrollMore(list.scrollHeight > list.clientHeight + 2 && remaining > 8);
  }

  function closeDrawer(): void {
    setDrawer({ open: false });
  }

  function showDrawer(
    identity: DrawerIdentity,
    dossier: DossierLoadState,
  ): void {
    setDrawer({ open: true, ...identity, dossier });
  }

  async function loadDossierForPlayer(identity: DrawerIdentity): Promise<void> {
    if (identity.playerId == null) {
      throw new Error("loadDossierForPlayer requires a resolved player id.");
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const playerId = identity.playerId;

    showDrawer(identity, { status: "loading" });

    try {
      const response = await fetch(`/api/dossier/${playerId}`);
      const json: unknown = await response.json();
      if (requestId !== requestIdRef.current) return;

      if (!response.ok) {
        const err = apiErrorSchema.safeParse(json);
        const message = err.success
          ? err.data.error.message
          : "Could not load dossier.";
        showDrawer(identity, { status: "error", message });
        return;
      }

      const parsed = dossierApiResponseSchema.safeParse(json);
      if (!parsed.success) {
        showDrawer(identity, {
          status: "error",
          message: "Dossier response failed validation.",
        });
        return;
      }

      showDrawer(identity, {
        status: "ready",
        dossier: parsed.data.dossier,
      });
    } catch {
      if (requestId !== requestIdRef.current) return;
      showDrawer(identity, {
        status: "error",
        message: "Could not reach dossier API.",
      });
    }
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
      showDrawer(identity, {
        status: "unavailable",
        message:
          "This Nets player does not have a resolved BALLDONTLIE id yet — dossier will unlock once the seed id is filled.",
      });
      return;
    }

    void loadDossierForPlayer(identity);
  }

  function openForAcquisition(player: PlayerSummary): void {
    void loadDossierForPlayer({
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

  useEffect(() => {
    if (!drawer.open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }

      const focusable = getFocusableElements(drawerRef.current);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [drawer.open]);

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
              {drawer.dossier.status === "loading" ? (
                <p className={styles.placeholder}>Loading role-fit dossier…</p>
              ) : null}
              {drawer.dossier.status === "error" ||
              drawer.dossier.status === "unavailable" ? (
                <p className={styles.placeholder} role="alert">
                  {drawer.dossier.message}
                </p>
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

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
  );
}
