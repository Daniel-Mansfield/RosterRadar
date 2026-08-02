import type { CourtSlot, PlayerId } from "@/domain/player";
import { normalizePersonName } from "@/nba/personName";

/**
 * Brooklyn Nets — curated roster seed for v1.
 *
 * Root cause: BALLDONTLIE free tier allows /nba/v1/players and /games, but
 * /players/active and box stats return 401. Filtering players by team_ids
 * returns historical Nets associations, not the current roster.
 *
 * We therefore maintain a small curated seed (names + slots + BDL ids when known
 * + ESPN athlete ids for headshots) and hydrate display from this seed.
 * Headshots are Option B (curated), not a full BDL→NBA id pipeline.
 *
 * Starter set approximates a common 2025–26 Nets group; not a live depth chart.
 *
 * Id resolution notes (2026-07-28, verified against live BDL search):
 * - Prefer real BDL ids; leave `null` when unresolved — never invent synthetic ids.
 * - Nolan Traore: BDL stores "Nolan Traoré" (accented) — search "Traore" misses him;
 *   found via search "Nolan" (id 1057275262, BKN).
 * - Cam Thomas: BDL lists as "Cam Thomas" (id 17896048) with team MIL; our curated
 *   roster keeps him on the Nets bench and id-based exclusion still applies.
 * - Nic Claxton: BDL lists as "Nicolas Claxton" (id 666508); team field may lag.
 */
export const BROOKLYN_NETS_TEAM_ID = 3;
export const BROOKLYN_NETS_ABBREVIATION = "BKN" as const;
export const BROOKLYN_NETS_NAME = "Brooklyn Nets";

export const STARTER_SLOTS = ["PG", "SG", "SF", "PF", "C"] as const;

export type NetsSeedEntry = {
  /** BALLDONTLIE player id when known; null until resolved. */
  id: PlayerId | null;
  /**
   * ESPN athlete id for headshot CDN (Option B).
   * Independent of BDL id — null means initials-only avatar.
   */
  espnAthleteId: number | null;
  firstName: string;
  lastName: string;
  position: string;
  slot: CourtSlot;
};

export const NETS_ROSTER_SEED: readonly NetsSeedEntry[] = [
  // Starters
  {
    id: 1057266813,
    espnAthleteId: 5175643,
    firstName: "Egor",
    lastName: "Demin",
    position: "G",
    slot: "PG",
  },
  {
    id: 1057275262,
    espnAthleteId: 5279130,
    firstName: "Nolan",
    lastName: "Traore",
    position: "G",
    slot: "SG",
  },
  {
    id: 375,
    espnAthleteId: 4278104,
    firstName: "Michael",
    lastName: "Porter Jr.",
    position: "F",
    slot: "SF",
  },
  {
    id: 56677843,
    espnAthleteId: 4712896,
    firstName: "Noah",
    lastName: "Clowney",
    position: "F",
    slot: "PF",
  },
  {
    id: 666508,
    espnAthleteId: 4278067,
    firstName: "Nic",
    lastName: "Claxton",
    position: "C",
    slot: "C",
  },
  // Bench
  {
    id: 17896048,
    espnAthleteId: 4432174,
    firstName: "Cam",
    lastName: "Thomas",
    position: "G",
    slot: "BENCH",
  },
  {
    id: 666743,
    espnAthleteId: 3907823,
    firstName: "Terance",
    lastName: "Mann",
    position: "G",
    slot: "BENCH",
  },
  {
    id: 17896027,
    espnAthleteId: 4433137,
    firstName: "Ziaire",
    lastName: "Williams",
    position: "F",
    slot: "BENCH",
  },
  {
    id: 17896038,
    espnAthleteId: 4432194,
    firstName: "Day'Ron",
    lastName: "Sharpe",
    position: "C",
    slot: "BENCH",
  },
  {
    id: 56677722,
    espnAthleteId: 4431714,
    firstName: "Jalen",
    lastName: "Wilson",
    position: "F",
    slot: "BENCH",
  },
  {
    id: 38017620,
    espnAthleteId: 4397018,
    firstName: "Ochai",
    lastName: "Agbaji",
    position: "G",
    slot: "BENCH",
  },
  {
    id: 1057280779,
    espnAthleteId: 5107173,
    firstName: "Danny",
    lastName: "Wolf",
    position: "F",
    slot: "BENCH",
  },
  {
    id: 1057279425,
    espnAthleteId: 5037873,
    firstName: "Drake",
    lastName: "Powell",
    position: "G",
    slot: "BENCH",
  },
  {
    id: 1057279760,
    espnAthleteId: 5242502,
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
