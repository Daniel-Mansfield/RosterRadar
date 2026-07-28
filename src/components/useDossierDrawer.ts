"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";

import type { Dossier } from "@/domain/dossier";
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
  /** Open the drawer and load the dossier; requires a resolved player id. */
  openDossier: (identity: DrawerIdentity) => void;
  /** Open the drawer in the terminal "unavailable" state (no fetch). */
  showUnavailable: (identity: DrawerIdentity, message: string) => void;
  closeDrawer: () => void;
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
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const requestIdRef = useRef(0);
  const titleId = useId();

  function closeDrawer(): void {
    // Invalidate in-flight dossier fetches so a late response cannot reopen the drawer.
    requestIdRef.current += 1;
    setDrawer({ open: false });
  }

  function showDrawer(
    identity: DrawerIdentity,
    dossier: DossierLoadState,
  ): void {
    setDrawer({ open: true, ...identity, dossier });
  }

  function showUnavailable(identity: DrawerIdentity, message: string): void {
    // Terminal state — invalidate any in-flight fetch from a previous open.
    requestIdRef.current += 1;
    showDrawer(identity, { status: "unavailable", message });
  }

  async function loadDossier(identity: DrawerIdentity): Promise<void> {
    if (identity.playerId == null) {
      throw new Error("openDossier requires a resolved player id.");
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

  function openDossier(identity: DrawerIdentity): void {
    void loadDossier(identity);
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

  return {
    drawer,
    openDossier,
    showUnavailable,
    closeDrawer,
    drawerRef,
    closeButtonRef,
    titleId,
  };
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
  );
}
