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
import { PlayerCard } from "@/components/PlayerCard";
import {
  apiErrorSchema,
} from "@/lib/api/schemas";
import { dossierApiResponseSchema } from "@/lib/api/dossierSchema";

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
      playerId: number | null;
      dossier: DossierLoadState;
    };

type DossierLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; dossier: Dossier }
  | { status: "unavailable"; message: string };

export function NetsHome({ roster }: NetsHomeProps): ReactElement {
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const requestIdRef = useRef(0);

  function closeDrawer(): void {
    setDrawer({ open: false });
  }

  async function loadDossierForPlayer(
    playerId: number,
    title: string,
    subtitle: string,
  ): Promise<void> {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setDrawer({
      open: true,
      title,
      subtitle,
      playerId,
      dossier: { status: "loading" },
    });

    try {
      const response = await fetch(`/api/dossier/${playerId}`);
      const json: unknown = await response.json();
      if (requestId !== requestIdRef.current) return;

      if (!response.ok) {
        const err = apiErrorSchema.safeParse(json);
        const message = err.success
          ? err.data.error.message
          : "Could not load dossier.";
        setDrawer({
          open: true,
          title,
          subtitle,
          playerId,
          dossier: { status: "error", message },
        });
        return;
      }

      const parsed = dossierApiResponseSchema.safeParse(json);
      if (!parsed.success) {
        setDrawer({
          open: true,
          title,
          subtitle,
          playerId,
          dossier: {
            status: "error",
            message: "Dossier response failed validation.",
          },
        });
        return;
      }

      setDrawer({
        open: true,
        title,
        subtitle,
        playerId,
        dossier: { status: "ready", dossier: parsed.data.dossier },
      });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setDrawer({
        open: true,
        title,
        subtitle,
        playerId,
        dossier: {
          status: "error",
          message: "Could not reach dossier API.",
        },
      });
    }
  }

  function openForRosterPlayer(player: RosterPlayer): void {
    const title = `${player.firstName} ${player.lastName}`;
    const subtitle = `${roster.teamName} · ${player.slot}${
      player.position ? ` · ${player.position}` : ""
    }`;

    if (player.id == null) {
      setDrawer({
        open: true,
        title,
        subtitle,
        playerId: null,
        dossier: {
          status: "unavailable",
          message:
            "This Nets player does not have a resolved BALLDONTLIE id yet — dossier will unlock once the seed id is filled.",
        },
      });
      return;
    }

    void loadDossierForPlayer(player.id, title, subtitle);
  }

  function openForAcquisition(player: PlayerSummary): void {
    const title = `${player.firstName} ${player.lastName}`;
    const subtitle = `Acquisition candidate · ${player.teamAbbreviation ?? "FA"}${
      player.position ? ` · ${player.position}` : ""
    }`;
    void loadDossierForPlayer(player.id, title, subtitle);
  }

  useEffect(() => {
    if (!drawer.open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closeButtonRef.current?.focus();

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
      previousFocusRef.current?.focus();
    };
  }, [drawer.open]);

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
              <li key={rosterPlayerKey(player)}>
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
              <div>
                <h2 id={titleId} className={styles.drawerTitle}>
                  {drawer.title}
                </h2>
                <p className={styles.drawerSub}>{drawer.subtitle}</p>
              </div>
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
                <DossierPanel dossier={drawer.dossier.dossier} />
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
