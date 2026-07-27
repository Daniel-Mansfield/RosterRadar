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
 *
 * Id resolution notes (2026-07-26 self-review):
 * - Prefer real BDL ids; leave `null` when unresolved — never invent synthetic ids.
 * - Nolan Traore: search returned a different Traore; keep null until confirmed.
 * - Nic Claxton: BDL lists as "Nicolas Claxton" (id 666508); team field may lag.
 */
export const BROOKLYN_NETS_TEAM_ID = 3;
export const BROOKLYN_NETS_ABBREVIATION = "BKN" as const;
export const BROOKLYN_NETS_NAME = "Brooklyn Nets";

export const STARTER_SLOTS = ["PG", "SG", "SF", "PF", "C"] as const;

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
    id: 1057266813,
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
    id: 666508,
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
    id: 666743,
    firstName: "Terance",
    lastName: "Mann",
    position: "G",
    slot: "BENCH",
  },
  {
    id: 17896027,
    firstName: "Ziaire",
    lastName: "Williams",
    position: "F",
    slot: "BENCH",
  },
  {
    id: 17896038,
    firstName: "Day'Ron",
    lastName: "Sharpe",
    position: "C",
    slot: "BENCH",
  },
  {
    id: 56677722,
    firstName: "Jalen",
    lastName: "Wilson",
    position: "F",
    slot: "BENCH",
  },
  {
    id: 38017620,
    firstName: "Ochai",
    lastName: "Agbaji",
    position: "G",
    slot: "BENCH",
  },
  {
    id: 1057280779,
    firstName: "Danny",
    lastName: "Wolf",
    position: "F",
    slot: "BENCH",
  },
  {
    id: 1057279425,
    firstName: "Drake",
    lastName: "Powell",
    position: "G",
    slot: "BENCH",
  },
  {
    id: 1057279760,
    firstName: "Ben",
    lastName: "Saraf",
    position: "G",
    slot: "BENCH",
  },
] as const;

/** Lowercased "firstname|lastname" keys for acquisition-search exclusion. */
export const NETS_SEED_NAME_KEYS: ReadonlySet<string> = new Set(
  NETS_ROSTER_SEED.map(
    (entry) =>
      `${normalizePersonName(entry.firstName)}|${normalizePersonName(entry.lastName)}`,
  ),
);

export function normalizePersonName(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}
