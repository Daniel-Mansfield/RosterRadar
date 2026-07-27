import type { CourtSlot, PlayerId } from "@/domain/player";

/**
 * Brooklyn Nets — curated roster seed for v1.
 *
 * Root cause: BALLDONTLIE free tier allows /nba/v1/players and /games, but
 * /players/active and box stats return 401. Filtering players by team_ids
 * returns historical Nets associations, not the current roster.
 *
 * We therefore maintain a small curated seed (names + slots + BDL ids when known)
 * and hydrate display from this seed. Update ids when resolving against the API.
 *
 * Starter set approximates a common 2025–26 Nets group; not a live depth chart.
 */
export const BROOKLYN_NETS_TEAM_ID = 3;
export const BROOKLYN_NETS_ABBREVIATION = "BKN" as const;
export const BROOKLYN_NETS_NAME = "Brooklyn Nets";

export type NetsSeedEntry = {
  /** BALLDONTLIE player id when known; null until resolved. */
  id: PlayerId | null;
  firstName: string;
  lastName: string;
  position: string;
  slot: CourtSlot;
};

export const NETS_ROSTER_SEED: readonly NetsSeedEntry[] = [
  // Starters
  {
    id: null,
    firstName: "Egor",
    lastName: "Demin",
    position: "G",
    slot: "PG",
  },
  {
    id: null,
    firstName: "Nolan",
    lastName: "Traore",
    position: "G",
    slot: "SG",
  },
  {
    id: 375,
    firstName: "Michael",
    lastName: "Porter Jr.",
    position: "F",
    slot: "SF",
  },
  {
    id: 56677843,
    firstName: "Noah",
    lastName: "Clowney",
    position: "F",
    slot: "PF",
  },
  {
    id: null,
    firstName: "Nic",
    lastName: "Claxton",
    position: "C",
    slot: "C",
  },
  // Bench
  {
    id: null,
    firstName: "Cam",
    lastName: "Thomas",
    position: "G",
    slot: "BENCH",
  },
  {
    id: null,
    firstName: "Terance",
    lastName: "Mann",
    position: "G",
    slot: "BENCH",
  },
  {
    id: null,
    firstName: "Ziaire",
    lastName: "Williams",
    position: "F",
    slot: "BENCH",
  },
  {
    id: null,
    firstName: "Day'Ron",
    lastName: "Sharpe",
    position: "C",
    slot: "BENCH",
  },
  {
    id: null,
    firstName: "Jalen",
    lastName: "Wilson",
    position: "F",
    slot: "BENCH",
  },
  {
    id: null,
    firstName: "Ochai",
    lastName: "Agbaji",
    position: "G",
    slot: "BENCH",
  },
  {
    id: null,
    firstName: "Danny",
    lastName: "Wolf",
    position: "F",
    slot: "BENCH",
  },
  {
    id: null,
    firstName: "Drake",
    lastName: "Powell",
    position: "G",
    slot: "BENCH",
  },
  {
    id: null,
    firstName: "Ben",
    lastName: "Saraf",
    position: "G",
    slot: "BENCH",
  },
] as const;
