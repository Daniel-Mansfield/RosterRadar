"use client";

import { useState } from "react";

import type { PlayerSummary } from "@/domain/player";

import styles from "./AcquisitionSearch.module.css";

type AcquisitionSearchProps = {
  onSelectPlayer?: (player: PlayerSummary) => void;
};

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; players: PlayerSummary[] };

export function AcquisitionSearch({
  onSelectPlayer,
}: AcquisitionSearchProps): React.ReactElement {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  async function runSearch(value: string): Promise<void> {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });
    try {
      const response = await fetch(
        `/api/players?q=${encodeURIComponent(trimmed)}`,
      );
      const json: unknown = await response.json();
      if (!response.ok) {
        const message = readErrorMessage(json) ?? "Search failed.";
        setState({ status: "error", message });
        return;
      }

      const players = readPlayers(json);
      setState({ status: "ready", players });
    } catch {
      setState({
        status: "error",
        message: "Could not reach player search.",
      });
    }
  }

  return (
    <section className={styles.wrap} aria-label="Search non-Nets players">
      <label className={styles.label} htmlFor="acquisition-search">
        Evaluate a player (not on the Nets)
      </label>
      <input
        id="acquisition-search"
        className={styles.input}
        type="search"
        autoComplete="off"
        placeholder="Start typing a player name…"
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          void runSearch(next);
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
          {state.players.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                className={styles.result}
                onClick={() => onSelectPlayer?.(player)}
              >
                <span>
                  {player.firstName} {player.lastName}
                </span>
                <span className={styles.resultMeta}>
                  {player.teamAbbreviation ?? "FA"}
                  {player.position ? ` · ${player.position}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function readErrorMessage(json: unknown): string | null {
  if (
    typeof json === "object" &&
    json !== null &&
    "error" in json &&
    typeof (json as { error?: { message?: unknown } }).error?.message ===
      "string"
  ) {
    return (json as { error: { message: string } }).error.message;
  }
  return null;
}

function readPlayers(json: unknown): PlayerSummary[] {
  if (
    typeof json === "object" &&
    json !== null &&
    "players" in json &&
    Array.isArray((json as { players: unknown }).players)
  ) {
    return (json as { players: PlayerSummary[] }).players;
  }
  return [];
}
