"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

import type { PlayerSummary } from "@/domain/player";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import {
  apiErrorSchema,
  playersApiResponseSchema,
} from "@/lib/api/schemas";

import styles from "./AcquisitionSearch.module.css";

const SEARCH_DEBOUNCE_MS = 280;

type AcquisitionSearchProps = {
  onSelectPlayer?: (player: PlayerSummary) => void;
  /** Arm acquisition swap — user then picks a starter slot on the court. */
  onBeginPlace?: (player: PlayerSummary) => void;
  /** Player currently waiting for a court slot (highlight its row). */
  pendingPlayerId?: number | null;
};

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; players: PlayerSummary[] };

export function AcquisitionSearch({
  onSelectPlayer,
  onBeginPlace,
  pendingPlayerId = null,
}: AcquisitionSearchProps): ReactElement {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = window.setTimeout(() => {
      void (async () => {
        setState({ status: "loading" });
        try {
          const response = await fetch(
            `/api/players?q=${encodeURIComponent(trimmed)}`,
            { signal: controller.signal },
          );
          const json: unknown = await response.json();
          if (requestId !== requestIdRef.current) {
            return;
          }
          if (!response.ok) {
            const message = readErrorMessage(json) ?? "Search failed.";
            setState({ status: "error", message });
            return;
          }

          const players = readPlayers(json);
          if (players == null) {
            setState({
              status: "error",
              message: "Search response failed validation.",
            });
            return;
          }
          setState({ status: "ready", players });
        } catch (error) {
          if (isAbortError(error) || requestId !== requestIdRef.current) {
            return;
          }
          setState({
            status: "error",
            message: "Could not reach player search.",
          });
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleBeginPlace(player: PlayerSummary): void {
    onBeginPlace?.(player);
    // Collapse the dropdown so the court is visible for slot pick.
    setState({ status: "idle" });
  }

  return (
    <section className={styles.wrap} aria-label="Search non-Nets players">
      <input
        id="acquisition-search"
        className={styles.input}
        type="search"
        autoComplete="off"
        placeholder="Search players…"
        aria-label="Search non-Nets players"
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          if (next.trim().length < 2) {
            abortRef.current?.abort();
            requestIdRef.current += 1;
            setState({ status: "idle" });
          }
        }}
      />

      {state.status === "loading" ? (
        <p className={styles.hint}>Searching…</p>
      ) : null}
      {state.status === "error" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "ready" && state.players.length === 0 ? (
        <p className={styles.hint}>No non-Nets players matched.</p>
      ) : null}
      {state.status === "ready" && state.players.length > 0 ? (
        <ul className={styles.results}>
          {state.players.map((player) => {
            const pending = pendingPlayerId === player.id;
            const name = `${player.firstName} ${player.lastName}`;
            return (
              <li key={player.id}>
                <div
                  className={`${styles.resultRow} ${pending ? styles.resultPending : ""}`}
                >
                  <button
                    type="button"
                    className={styles.result}
                    onClick={() => onSelectPlayer?.(player)}
                  >
                    <span className={styles.resultMain}>
                      <PlayerAvatar
                        firstName={player.firstName}
                        lastName={player.lastName}
                        size={40}
                      />
                      <span>
                        {player.firstName} {player.lastName}
                      </span>
                    </span>
                    <span className={styles.resultMeta}>
                      {player.teamAbbreviation ?? "FA"}
                      {player.position ? ` · ${player.position}` : ""}
                    </span>
                  </button>
                  {onBeginPlace ? (
                    <button
                      type="button"
                      className={styles.swap}
                      onClick={() => handleBeginPlace(player)}
                      aria-pressed={pending}
                      aria-label={`Swap ${name} onto a starter slot`}
                    >
                      <svg
                        className={styles.swapIcon}
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
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function readErrorMessage(json: unknown): string | null {
  const parsed = apiErrorSchema.safeParse(json);
  return parsed.success ? parsed.data.error.message : null;
}

function readPlayers(json: unknown): PlayerSummary[] | null {
  const parsed = playersApiResponseSchema.safeParse(json);
  return parsed.success ? parsed.data.players : null;
}
