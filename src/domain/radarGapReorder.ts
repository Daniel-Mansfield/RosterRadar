import type { PillarId } from "@/domain/dossier";
import type { TeamFit, TeamFitPillar } from "@/domain/teamFit";
import { TEAM_GAP_THRESHOLD } from "@/scoring/composeTeamFit";

/**
 * Primary lineup need for Radar reorder: the weakest hard gap (≤ threshold),
 * else the softest pillar overall so the control still works on balanced fives.
 */
export function primaryLineupNeedPillar(
  teamFit: TeamFit,
): TeamFitPillar | null {
  if (teamFit.pillars.length === 0) {
    return null;
  }

  const gaps = teamFit.pillars
    .filter((pillar) => pillar.percentile <= TEAM_GAP_THRESHOLD)
    .sort(
      (a, b) =>
        a.percentile - b.percentile || a.id.localeCompare(b.id),
    );
  if (gaps[0]) {
    return gaps[0];
  }

  return [...teamFit.pillars].sort(
    (a, b) =>
      a.percentile - b.percentile || a.id.localeCompare(b.id),
  )[0] ?? null;
}

export function isHardLineupGap(pillar: TeamFitPillar): boolean {
  return pillar.percentile <= TEAM_GAP_THRESHOLD;
}

/**
 * Stable descending sort by pillar score. Missing scores sink to the bottom;
 * ties keep input order.
 */
export function reorderByPillarScores<T extends { id: number }>(
  candidates: readonly T[],
  scores: ReadonlyMap<number, number | null>,
): T[] {
  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: scores.get(candidate.id) ?? null,
    }))
    .sort((a, b) => {
      if (a.score == null && b.score == null) {
        return a.index - b.index;
      }
      if (a.score == null) return 1;
      if (b.score == null) return -1;
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.candidate);
}

export type RadarPillarScore = {
  playerId: number;
  percentile: number | null;
};

export function scoresByPlayerId(
  scores: readonly RadarPillarScore[],
): Map<number, number | null> {
  return new Map(scores.map((row) => [row.playerId, row.percentile]));
}

/** Narrow PillarId parse for route / query validation helpers. */
export function isPillarId(value: string): value is PillarId {
  return (
    value === "scoring" ||
    value === "playmaking" ||
    value === "rebounding" ||
    value === "spacing" ||
    value === "disruption" ||
    value === "workload"
  );
}
