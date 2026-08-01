export type PlayerId = number;

export type PlayerSummary = {
  /** BALLDONTLIE player id — always set for search results. */
  id: PlayerId;
  firstName: string;
  lastName: string;
  position: string | null;
  teamAbbreviation: string | null;
  /**
   * ESPN athlete id for headshots when curated or best-effort resolved;
   * `null` → initials avatar. Never used for BALLDONTLIE calls.
   */
  espnAthleteId: number | null;
};

/** Court / bench placement for the Nets home view. */
export type CourtSlot = "PG" | "SG" | "SF" | "PF" | "C" | "BENCH";

export type RosterPlayer = {
  /**
   * BALLDONTLIE id when resolved; `null` until known.
   * Never call dossier/stats APIs with a null id.
   */
  id: PlayerId | null;
  /**
   * ESPN athlete id for Nets headshots when curated; `null` → initials avatar.
   * Not used for BALLDONTLIE calls.
   */
  espnAthleteId: number | null;
  firstName: string;
  lastName: string;
  position: string | null;
  teamAbbreviation: string | null;
  slot: CourtSlot;
};

export type NetsRoster = {
  teamId: number;
  teamAbbreviation: "BKN";
  teamName: string;
  starters: RosterPlayer[];
  bench: RosterPlayer[];
};

/** Stable React list key — prefers BDL id, else name+slot. */
export function rosterPlayerKey(player: RosterPlayer): string {
  if (player.id != null) {
    return `id:${player.id}`;
  }
  return `seed:${player.slot}:${player.firstName}:${player.lastName}`;
}
