/**
 * "On the Radar" — curated pool of non-Nets acquisition targets.
 *
 * Every entry was verified against live vendors on 2026-07-28:
 * - `id` from BALLDONTLIE player search (team abbreviations match BDL's data);
 * - `espnAthleteId` from ESPN's athlete search (headshot CDN), cross-checked
 *   so both vendors agreed on the player's current team.
 *
 * The pool is intentionally static: rendering the list costs zero API calls,
 * and clicking a card opens the same live dossier flow as acquisition search.
 */

export type RadarCandidate = {
  /** BALLDONTLIE id — pre-verified, so radar cards always open a live dossier. */
  id: number;
  /** ESPN athlete id for the headshot, verified alongside the BDL id. */
  espnAthleteId: number;
  firstName: string;
  lastName: string;
  position: string;
  teamAbbreviation: string;
  /** One-line scouting angle shown on the card. */
  angle: string;
};

export const RADAR_POOL: readonly RadarCandidate[] = [
  // Guards
  {
    id: 419,
    espnAthleteId: 4351851,
    firstName: "Anfernee",
    lastName: "Simons",
    position: "G",
    teamAbbreviation: "PHI",
    angle: "Expiring deal; the shot creation the young backcourt lacks.",
  },
  {
    id: 413,
    espnAthleteId: 4277811,
    firstName: "Collin",
    lastName: "Sexton",
    position: "G",
    teamAbbreviation: "LAL",
    angle: "Buy-low downhill scorer for the second unit.",
  },
  {
    id: 666956,
    espnAthleteId: 4395651,
    firstName: "Coby",
    lastName: "White",
    position: "G",
    teamAbbreviation: "CHA",
    angle: "Ascending combo guard on the core's timeline.",
  },
  {
    id: 17895858,
    espnAthleteId: 4397014,
    firstName: "Quentin",
    lastName: "Grimes",
    position: "G",
    teamAbbreviation: "LAL",
    angle: "3-and-D guard with a soft market.",
  },
  // Wings
  {
    id: 56677831,
    espnAthleteId: 5105592,
    firstName: "Cam",
    lastName: "Whitmore",
    position: "F",
    teamAbbreviation: "WAS",
    angle: "Post-hype wing swing at low acquisition cost.",
  },
  {
    id: 17553979,
    espnAthleteId: 4433247,
    firstName: "Jonathan",
    lastName: "Kuminga",
    position: "F",
    teamAbbreviation: "ATL",
    angle: "High-ceiling forward; fit questions elsewhere are our opening.",
  },
  {
    id: 265,
    espnAthleteId: 3134907,
    firstName: "Kyle",
    lastName: "Kuzma",
    position: "F",
    teamAbbreviation: "MIL",
    angle: "Veteran scoring forward on movable money.",
  },
  {
    id: 666679,
    espnAthleteId: 3138196,
    firstName: "Cameron",
    lastName: "Johnson",
    position: "F",
    teamAbbreviation: "DEN",
    angle: "Reunion candidate; elite movement shooting.",
  },
  {
    id: 3547293,
    espnAthleteId: 4278594,
    firstName: "Naji",
    lastName: "Marshall",
    position: "F",
    teamAbbreviation: "DAL",
    angle: "Low-cost wing defense and toughness.",
  },
  {
    id: 17896024,
    espnAthleteId: 4277813,
    firstName: "Herbert",
    lastName: "Jones",
    position: "F",
    teamAbbreviation: "NOP",
    angle: "Elite point-of-attack defender if New Orleans retools.",
  },
  // Bigs
  {
    id: 38017705,
    espnAthleteId: 4433136,
    firstName: "Walker",
    lastName: "Kessler",
    position: "C",
    teamAbbreviation: "LAL",
    angle: "Rim protection to pair with — or succeed — Claxton.",
  },
  {
    id: 3547244,
    espnAthleteId: 4431680,
    firstName: "Onyeka",
    lastName: "Okongwu",
    position: "F-C",
    teamAbbreviation: "ATL",
    angle: "Switchable big on the same timeline as the core.",
  },
  {
    id: 373,
    espnAthleteId: 3134908,
    firstName: "Jakob",
    lastName: "Poeltl",
    position: "C",
    teamAbbreviation: "TOR",
    angle: "Stabilizing veteran anchor for a young rotation.",
  },
  {
    id: 476,
    espnAthleteId: 4066211,
    firstName: "Robert",
    lastName: "Williams III",
    position: "C-F",
    teamAbbreviation: "POR",
    angle: "Buy-low rim protector; injury risk priced in.",
  },
];

/**
 * How many candidates the home panel surfaces per shuffle.
 * Equals the curated pool so the strip shows every seeded target; Shuffle
 * still redraws via {@link pickRadarCandidates} (a random subset of the pool,
 * which is the full pool at the current seed size).
 */
export const RADAR_PICK_COUNT = RADAR_POOL.length;

/**
 * Random subset of the pool, order shuffled. `random` is injectable so tests
 * are deterministic; implemented as a random-key sort (pool is small).
 */
export function pickRadarCandidates(
  pool: readonly RadarCandidate[],
  count: number,
  random: () => number = Math.random,
): RadarCandidate[] {
  return pool
    .map((candidate) => ({ candidate, key: random() }))
    .sort((a, b) => a.key - b.key)
    .slice(0, Math.max(0, count))
    .map((entry) => entry.candidate);
}
