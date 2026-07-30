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

export const SCORING_VERSION = "rr-role-fit-v1.1";

/**
 * A creator read requires playmaking to stand up to the player's rebounding
 * profile (within this margin). League-wide assist ranks put ~3 apg bigs near
 * the 70th percentile, so absolute thresholds alone mislabel paint players.
 */
export const CREATOR_DOMINANCE_MARGIN = 15;

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

/** English ordinal for percentile copy — "71st", "82nd", "93rd", "11th". */
export function ordinal(n: number): string {
  const rem100 = Math.abs(n) % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const rem10 = Math.abs(n) % 10;
  if (rem10 === 1) return `${n}st`;
  if (rem10 === 2) return `${n}nd`;
  if (rem10 === 3) return `${n}rd`;
  return `${n}th`;
}

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

/** Single source for pillar percentiles — used by role detection AND pillar display so they can never drift. */
function pillarPercentiles(line: PlayerSeasonLine): Record<PillarId, number> {
  return {
    scoring: percentileFromRank(line.ranks.points),
    playmaking: percentileFromRank(line.ranks.assists),
    rebounding: percentileFromRank(line.ranks.rebounds),
    spacing: percentileFromRank(line.ranks.fg3a),
    disruption: Math.round(
      (percentileFromRank(line.ranks.steals) +
        percentileFromRank(line.ranks.blocks)) /
        2,
    ),
    workload: percentileFromRank(line.ranks.minutes),
  };
}

export function detectRole(line: PlayerSeasonLine): RoleId {
  const p = pillarPercentiles(line);

  // Creator read only when playmaking is a dominant trait, not incidental:
  // bigs clear the absolute assist threshold on league-wide ranks while their
  // rebounding profile dwarfs it (e.g. playmaking 73 vs rebounding 98).
  if (
    p.playmaking >= 70 &&
    p.scoring >= 55 &&
    p.playmaking + CREATOR_DOMINANCE_MARGIN >= p.rebounding
  ) {
    return "primary_creator";
  }
  if (p.rebounding >= 70 && p.scoring >= 45) return "paint_anchor";
  if (p.spacing >= 70 && p.scoring >= 50) return "wing_scorer";
  if (p.spacing >= 65 && p.playmaking < 55) return "spacer";
  if (p.playmaking >= 60 && p.scoring < 60) return "connector";
  if (p.rebounding >= 55 && p.scoring >= 55) return "versatile_forward";
  if (p.disruption >= 70 && p.scoring < 55) return "connector";
  return p.scoring >= p.playmaking ? "wing_scorer" : "connector";
}

export function buildPillars(line: PlayerSeasonLine): RolePillar[] {
  const p = pillarPercentiles(line);
  const disruptionRaw = line.steals + line.blocks;
  return [
    {
      id: "scoring",
      label: PILLAR_LABELS.scoring,
      percentile: p.scoring,
      raw: line.points,
      unit: "ppg",
    },
    {
      id: "playmaking",
      label: PILLAR_LABELS.playmaking,
      percentile: p.playmaking,
      raw: line.assists,
      unit: "apg",
    },
    {
      id: "rebounding",
      label: PILLAR_LABELS.rebounding,
      percentile: p.rebounding,
      raw: line.rebounds,
      unit: "rpg",
    },
    {
      id: "spacing",
      label: PILLAR_LABELS.spacing,
      percentile: p.spacing,
      raw: line.fg3a,
      unit: "3pa",
    },
    {
      id: "disruption",
      label: PILLAR_LABELS.disruption,
      percentile: p.disruption,
      raw: Number(disruptionRaw.toFixed(1)),
      unit: "stl+blk",
    },
    {
      id: "workload",
      label: PILLAR_LABELS.workload,
      percentile: p.workload,
      raw: line.minutes,
      unit: "mpg",
    },
  ];
}

/**
 * Shared grade → recommendation banding (player dossiers and lineup fit).
 * "Strong" is a commitment; never make it on a thin sample. The grade stays
 * honest — only the recommendation is capped.
 */
export function recommendationFromGrade(
  grade: number,
  thinSample = false,
): FitRecommendation {
  const recommendation: FitRecommendation =
    grade >= 65 ? "strong" : grade >= 45 ? "conditional" : "poor";
  if (thinSample && recommendation === "strong") {
    return "conditional";
  }
  return recommendation;
}

export function fitFromPillars(
  pillars: RolePillar[],
  options: { thinSample?: boolean } = {},
): {
  grade: number;
  recommendation: FitRecommendation;
} {
  if (pillars.length === 0) {
    return { grade: 50, recommendation: "conditional" };
  }
  const grade = Math.round(
    pillars.reduce((sum, p) => sum + p.percentile, 0) / pillars.length,
  );
  return {
    grade,
    recommendation: recommendationFromGrade(grade, options.thinSample),
  };
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
    text: `${p.label} sits near the ${ordinal(p.percentile)} percentile (${p.raw} ${p.unit}), supporting a ${ROLE_LABELS[roleId].toLowerCase()} read.`,
  }));
  const risks = [...pillars]
    .sort((a, b) => a.percentile - b.percentile)
    .slice(0, 2)
    .map((p) => ({
      kind: "risk" as const,
      text: `${p.label} is a relative gap (${ordinal(p.percentile)} percentile at ${p.raw} ${p.unit}) — worth stress-testing in role fit.`,
    }));
  return [...strengths, ...risks];
}

export function buildVerdict(
  recommendation: FitRecommendation,
  roleId: RoleId,
  grade: number,
  thinSample = false,
): string {
  const role = ROLE_LABELS[roleId].toLowerCase();
  const caveat = thinSample
    ? " Thin sample — treat as a preliminary read until more games land."
    : "";
  if (recommendation === "strong") {
    return `Strong ${role} profile (fit ${grade}) — core skills clear enough to build around in that role.${caveat}`;
  }
  if (recommendation === "conditional") {
    return `Conditional ${role} fit (grade ${grade}) — usable, but scheme and surrounding pieces matter.${caveat}`;
  }
  return `Poor ${role} fit on current evidence (grade ${grade}) — role mismatch or thin production vs peers.${caveat}`;
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
  const confidenceLevel = confidenceFromSample(
    line.gamesPlayed,
    line.minutes,
  );
  const thinSample = confidenceLevel === "low";
  const { grade, recommendation } = fitFromPillars(pillars, { thinSample });

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
      verdict: buildVerdict(recommendation, roleId, grade, thinSample),
    },
    confidence: {
      level: confidenceLevel,
      thinSample,
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
        "A creator read requires playmaking to stand up to the player's rebounding profile, so bigs with incidental assist ranks keep their paint label.",
        "Thin samples (low confidence) cap the recommendation at Conditional and mark the verdict as preliminary.",
        "Last-10 evidence ignores games under the minimum minutes threshold (DNPs / traces).",
        "Upstream season/search reads use a short process-local TTL cache (~10 min) to respect vendor rate limits.",
      ],
    },
  };
}
