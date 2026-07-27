import type {
  Callout,
  ConfidenceLevel,
  Dossier,
  EvidenceMetric,
  FitRecommendation,
  PillarId,
  PlayerGameLine,
  PlayerSeasonLine,
  RoleId,
  RolePillar,
} from "@/domain/dossier";

export const SCORING_VERSION = "rr-role-fit-v1";

/** Assumed ranked pool size when converting vendor ranks → percentiles. */
export const PEER_POOL_SIZE = 500;

export const MIN_MINUTES_FOR_GAME = 5;

const ROLE_LABELS = {
  primary_creator: "Primary creator",
  wing_scorer: "Wing scorer",
  spacer: "Spacer / shooter",
  connector: "Connector",
  paint_anchor: "Paint anchor",
  versatile_forward: "Versatile forward",
} as const satisfies Record<RoleId, string>;

const PILLAR_LABELS = {
  scoring: "Scoring",
  playmaking: "Playmaking",
  rebounding: "Rebounding",
  spacing: "Spacing",
  disruption: "Disruption",
  workload: "Workload",
} as const satisfies Record<PillarId, string>;

export function percentileFromRank(
  rank: number | null,
  poolSize: number = PEER_POOL_SIZE,
): number {
  if (rank == null || rank <= 0 || poolSize <= 1) {
    return 50;
  }
  const clamped = Math.min(rank, poolSize);
  const pct = (100 * (poolSize - clamped)) / (poolSize - 1);
  return Math.max(0, Math.min(99, Math.round(pct)));
}

export function detectRole(line: PlayerSeasonLine): RoleId {
  const scoring = percentileFromRank(line.ranks.points);
  const playmaking = percentileFromRank(line.ranks.assists);
  const rebounding = percentileFromRank(line.ranks.rebounds);
  const spacing = percentileFromRank(line.ranks.fg3a);
  const disruption = Math.round(
    (percentileFromRank(line.ranks.steals) +
      percentileFromRank(line.ranks.blocks)) /
      2,
  );

  if (playmaking >= 70 && scoring >= 55) return "primary_creator";
  if (rebounding >= 70 && scoring >= 45) return "paint_anchor";
  if (spacing >= 70 && scoring >= 50) return "wing_scorer";
  if (spacing >= 65 && playmaking < 55) return "spacer";
  if (playmaking >= 60 && scoring < 60) return "connector";
  if (rebounding >= 55 && scoring >= 55) return "versatile_forward";
  if (disruption >= 70 && scoring < 55) return "connector";
  return scoring >= playmaking ? "wing_scorer" : "connector";
}

export function buildPillars(line: PlayerSeasonLine): RolePillar[] {
  const disruptionRaw = line.steals + line.blocks;
  const pillars: RolePillar[] = [
    {
      id: "scoring",
      label: PILLAR_LABELS.scoring,
      percentile: percentileFromRank(line.ranks.points),
      raw: line.points,
      unit: "ppg",
    },
    {
      id: "playmaking",
      label: PILLAR_LABELS.playmaking,
      percentile: percentileFromRank(line.ranks.assists),
      raw: line.assists,
      unit: "apg",
    },
    {
      id: "rebounding",
      label: PILLAR_LABELS.rebounding,
      percentile: percentileFromRank(line.ranks.rebounds),
      raw: line.rebounds,
      unit: "rpg",
    },
    {
      id: "spacing",
      label: PILLAR_LABELS.spacing,
      percentile: percentileFromRank(line.ranks.fg3a),
      raw: line.fg3a,
      unit: "3pa",
    },
    {
      id: "disruption",
      label: PILLAR_LABELS.disruption,
      percentile: Math.round(
        (percentileFromRank(line.ranks.steals) +
          percentileFromRank(line.ranks.blocks)) /
          2,
      ),
      raw: Number(disruptionRaw.toFixed(1)),
      unit: "stl+blk",
    },
    {
      id: "workload",
      label: PILLAR_LABELS.workload,
      percentile: percentileFromRank(line.ranks.minutes),
      raw: line.minutes,
      unit: "mpg",
    },
  ];
  return pillars;
}

export function fitFromPillars(pillars: RolePillar[]): {
  grade: number;
  recommendation: FitRecommendation;
} {
  if (pillars.length === 0) {
    return { grade: 50, recommendation: "conditional" };
  }
  const grade = Math.round(
    pillars.reduce((sum, p) => sum + p.percentile, 0) / pillars.length,
  );
  const recommendation: FitRecommendation =
    grade >= 65 ? "strong" : grade >= 45 ? "conditional" : "poor";
  return { grade, recommendation };
}

export function confidenceFromSample(
  gamesPlayed: number,
  minutesPerGame: number,
): ConfidenceLevel {
  if (gamesPlayed >= 40 && minutesPerGame >= 20) return "high";
  if (gamesPlayed >= 15 && minutesPerGame >= 12) return "medium";
  return "low";
}

export function buildCallouts(
  pillars: RolePillar[],
  roleId: RoleId,
): Callout[] {
  const sorted = [...pillars].sort((a, b) => b.percentile - a.percentile);
  const strengths = sorted.slice(0, 2).map((p) => ({
    kind: "strength" as const,
    text: `${p.label} sits near the ${p.percentile}th percentile (${p.raw} ${p.unit}), supporting a ${ROLE_LABELS[roleId].toLowerCase()} read.`,
  }));
  const risks = [...pillars]
    .sort((a, b) => a.percentile - b.percentile)
    .slice(0, 2)
    .map((p) => ({
      kind: "risk" as const,
      text: `${p.label} is a relative gap (${p.percentile}th percentile at ${p.raw} ${p.unit}) — worth stress-testing in role fit.`,
    }));
  return [...strengths, ...risks];
}

export function buildVerdict(
  recommendation: FitRecommendation,
  roleId: RoleId,
  grade: number,
): string {
  const role = ROLE_LABELS[roleId].toLowerCase();
  if (recommendation === "strong") {
    return `Strong ${role} profile (fit ${grade}) — core skills clear enough to build around in that role.`;
  }
  if (recommendation === "conditional") {
    return `Conditional ${role} fit (grade ${grade}) — usable, but scheme and surrounding pieces matter.`;
  }
  return `Poor ${role} fit on current evidence (grade ${grade}) — role mismatch or thin production vs peers.`;
}

export function averageLastN(
  games: PlayerGameLine[],
  n: number,
  pick: (g: PlayerGameLine) => number,
): number | null {
  const usable = games
    .filter((g) => g.minutes >= MIN_MINUTES_FOR_GAME)
    .slice(0, n);
  if (usable.length === 0) return null;
  const sum = usable.reduce((acc, g) => acc + pick(g), 0);
  return Number((sum / usable.length).toFixed(1));
}

export function buildEvidence(
  line: PlayerSeasonLine,
  games: PlayerGameLine[],
): EvidenceMetric[] {
  return [
    {
      id: "pts",
      label: "Points",
      season: line.points,
      last10: averageLastN(games, 10, (g) => g.points),
      unit: "ppg",
    },
    {
      id: "ast",
      label: "Assists",
      season: line.assists,
      last10: averageLastN(games, 10, (g) => g.assists),
      unit: "apg",
    },
    {
      id: "reb",
      label: "Rebounds",
      season: line.rebounds,
      last10: averageLastN(games, 10, (g) => g.rebounds),
      unit: "rpg",
    },
  ];
}

export function composeDossierFromLines(input: {
  line: PlayerSeasonLine;
  games: PlayerGameLine[];
  teamAbbreviation: string | null;
}): Dossier {
  const { line, games, teamAbbreviation } = input;
  const roleId = detectRole(line);
  const pillars = buildPillars(line);
  const { grade, recommendation } = fitFromPillars(pillars);
  const confidenceLevel = confidenceFromSample(
    line.gamesPlayed,
    line.minutes,
  );

  return {
    player: {
      id: line.playerId,
      firstName: line.firstName,
      lastName: line.lastName,
      position: line.position,
      teamAbbreviation,
    },
    season: line.season,
    role: {
      id: roleId,
      label: ROLE_LABELS[roleId],
    },
    fit: {
      grade,
      recommendation,
      verdict: buildVerdict(recommendation, roleId, grade),
    },
    confidence: {
      level: confidenceLevel,
      thinSample: confidenceLevel === "low",
      gamesPlayed: line.gamesPlayed,
      minutesPerGame: line.minutes,
    },
    pillars,
    callouts: buildCallouts(pillars, roleId),
    evidence: buildEvidence(line, games),
    methodology: {
      scoringVersion: SCORING_VERSION,
      peerPoolSize: PEER_POOL_SIZE,
      minMinutesForGame: MIN_MINUTES_FOR_GAME,
      notes: [
        "Percentiles are derived from BALLDONTLIE league ranks mapped onto an assumed peer pool.",
        "Role labels are RosterRadar heuristics from scoring/playmaking/rebounding/spacing mix — not official positions.",
        "Last-10 evidence ignores games under the minimum minutes threshold (DNPs / traces).",
        "Upstream season/search reads use a short process-local TTL cache (~10 min) to respect vendor rate limits.",
      ],
    },
  };
}
