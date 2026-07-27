/**
 * Headshot helpers for Nets roster cards (Option B).
 * ESPN athlete ids are curated in the seed — not derived from BALLDONTLIE ids.
 */

export function isEspnAthleteId(value: number | null | undefined): value is number {
  return value != null && Number.isInteger(value) && value > 0;
}

export function espnNbaHeadshotUrl(espnAthleteId: number): string {
  if (!isEspnAthleteId(espnAthleteId)) {
    throw new Error("espnAthleteId must be a positive integer.");
  }
  return `https://a.espncdn.com/i/headshots/nba/players/full/${espnAthleteId}.png`;
}

/** Two-letter initials for avatar fallback (e.g. "MP", "NC"). */
export function playerInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}
