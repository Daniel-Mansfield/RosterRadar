"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";

import type { Dossier } from "@/domain/dossier";
import type { LineupIncoming } from "@/domain/lineupSim";
import { apiErrorSchema } from "@/lib/api/schemas";
import { dossierApiResponseSchema } from "@/lib/api/dossierSchema";

export type DrawerIdentity = {
  title: string;
  subtitle: string;
  firstName: string;
  lastName: string;
  playerId: number | null;
  /** Curated ESPN headshot id when known (Nets seed / radar pool); null for search. */
  espnAthleteId: number | null;
  /** Full Radar scouting angle — shown in the drawer when opened from On the Radar. */
  radarAngle?: string | null;
  /**
   * When set (search / Radar acquisition), the drawer can offer “Try in lineup”.
   * Omitted for Nets roster opens.
   */
  tryInLineup?: LineupIncoming | null;
};

export type DossierLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; dossier: Dossier }
  | { status: "unavailable"; message: string };

export type DrawerState =
  | { open: false }
  | ({ open: true } & DrawerIdentity & { dossier: DossierLoadState });

type UseDossierDrawerResult = {
  drawer: DrawerState;
  /** True while the exit animation runs; identity stays mounted until finish. */
  isClosing: boolean;
  /** Open the drawer and load the dossier; requires a resolved player id. */
  openDossier: (identity: DrawerIdentity) => void;
  /** Open the drawer in the terminal "unavailable" state (no fetch). */
  showUnavailable: (identity: DrawerIdentity, message: string) => void;
  /** Re-fire the fetch for the currently open, errored dossier. */
  retryDossier: () => void;
  /** Begin close (exit motion); call again to finish immediately. */
  closeDrawer: () => void;
  /** Complete close after exit motion (or timeout fallback). */
  finishCloseDrawer: () => void;
  /** Attach to the dialog element — scopes the focus trap. */
  drawerRef: RefObject<HTMLElement | null>;
  /** Attach to the close button — receives initial focus on open. */
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  /** Set as `id` on the drawer title and `aria-labelledby` on the dialog. */
  titleId: string;
};

/**
 * Dossier drawer state + behavior, shared by every "open a player" flow
 * (court, bench, radar, acquisition search).
 *
 * Owns: load/error/ready state machine, stale-response invalidation, and the
 * dialog a11y contract (focus trap, Escape-to-close, body scroll lock, focus
 * restore). Callers only map their domain object to a `DrawerIdentity`.
 */
export function useDossierDrawer(): UseDossierDrawerResult {
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [isClosing, setIsClosing] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const requestIdRef = useRef(0);
  const isClosingRef = useRef(false);
  const drawerOpenRef = useRef(false);
  const titleId = useId();
  isClosingRef.current = isClosing;
  drawerOpenRef.current = drawer.open;

  function finishCloseDrawer(): void {
    // One-shot: transitionend can fire per property; ignore after the first finish.
    if (!drawerOpenRef.current && !isClosingRef.current) {
      return;
    }
    // Invalidate in-flight dossier fetches so a late response cannot reopen the drawer.
    requestIdRef.current += 1;
    isClosingRef.current = false;
    drawerOpenRef.current = false;
    setIsClosing(false);
    setDrawer({ open: false });
  }

  function closeDrawer(): void {
    // Second Escape / close during exit finishes immediately.
    if (isClosingRef.current) {
      finishCloseDrawer();
      return;
    }
    if (!drawerOpenRef.current) {
      return;
    }
    // Drop in-flight dossier responses so a late ready cannot cancel the exit.
    requestIdRef.current += 1;
    isClosingRef.current = true;
    setIsClosing(true);
  }

  function showDrawer(
    identity: DrawerIdentity,
    dossier: DossierLoadState,
  ): void {
    isClosingRef.current = false;
    setIsClosing(false);
    setDrawer({ open: true, ...identity, dossier });
  }

  function showUnavailable(identity: DrawerIdentity, message: string): void {
    // Terminal state — invalidate any in-flight fetch from a previous open.
    requestIdRef.current += 1;
    showDrawer(identity, { status: "unavailable", message });
  }

  async function loadDossier(
    identity: DrawerIdentity,
    playerId: number,
  ): Promise<void> {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

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

  function openDossier(identity: DrawerIdentity): void {
    if (identity.playerId == null) {
      // Synchronous throw: a contract violation should fail loudly at the
      // call site, not as an unhandled rejection inside the fetch task.
      throw new Error("openDossier requires a resolved player id.");
    }
    void loadDossier(identity, identity.playerId);
  }

  function retryDossier(): void {
    // Only an errored fetch is retryable; "unavailable" has no id to fetch.
    if (
      !drawer.open ||
      drawer.dossier.status !== "error" ||
      drawer.playerId == null
    ) {
      return;
    }
    // The retry button unmounts on the loading transition; park focus on the
    // stable close button so keyboard focus doesn't drop to <body>.
    closeButtonRef.current?.focus();
    void loadDossier(toDrawerIdentity(drawer), drawer.playerId);
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

  // Fallback if transitionend does not fire (reduced-motion / interrupted).
  useEffect(() => {
    if (!isClosing) {
      return;
    }
    const timer = window.setTimeout(() => {
      finishCloseDrawer();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isClosing]);

  return {
    drawer,
    isClosing,
    openDossier,
    showUnavailable,
    retryDossier,
    closeDrawer,
    finishCloseDrawer,
    drawerRef,
    closeButtonRef,
    titleId,
  };
}

/** Strip drawer chrome (`open` / `dossier`) so retries keep every identity field. */
function toDrawerIdentity(
  drawer: Extract<DrawerState, { open: true }>,
): DrawerIdentity {
  return {
    title: drawer.title,
    subtitle: drawer.subtitle,
    firstName: drawer.firstName,
    lastName: drawer.lastName,
    playerId: drawer.playerId,
    espnAthleteId: drawer.espnAthleteId,
    radarAngle: drawer.radarAngle,
    tryInLineup: drawer.tryInLineup,
  };
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
  );
}
