import { RADAR_POOL } from "@/nba/radar/radarPool";
import { NETS_ROSTER_SEED } from "@/nba/nets/rosterSeed";
import { isEspnAthleteId } from "@/nba/headshot";

/** BDL id → curated ESPN athlete id (Nets seed + Radar pool). */
const CURATED: ReadonlyMap<number, number> = (() => {
  const map = new Map<number, number>();
  for (const entry of NETS_ROSTER_SEED) {
    if (entry.id != null && isEspnAthleteId(entry.espnAthleteId)) {
      map.set(entry.id, entry.espnAthleteId);
    }
  }
  for (const candidate of RADAR_POOL) {
    if (isEspnAthleteId(candidate.espnAthleteId)) {
      map.set(candidate.id, candidate.espnAthleteId);
    }
  }
  return map;
})();

export function curatedEspnAthleteId(bdlPlayerId: number): number | null {
  return CURATED.get(bdlPlayerId) ?? null;
}
