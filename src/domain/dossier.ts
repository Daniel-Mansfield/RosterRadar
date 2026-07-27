import type { PlayerId, PlayerSummary } from "@/domain/player";

export type FitRecommendation = "strong" | "conditional" | "poor";

export type ConfidenceLevel = "high" | "medium" | "low";

export type RoleId =
  | "primary_creator"
  | "wing_scorer"
  | "spacer"
  | "connector"
  | "paint_anchor"
  | "versatile_forward";

export type PillarId =
  | "scoring"
  | "playmaking"
  | "rebounding"
  | "spacing"
  | "disruption"
  | "workload";

export type RolePillar = {
  id: PillarId;
  label: string;
  percentile: number;
  /** Raw per-game (or rate) value used for this pillar. */
  raw: number;
  unit: string;
};

export type Callout = {
  kind: "strength" | "risk";
  text: string;
};

export type EvidenceMetric = {
  id: string;
  label: string;
  season: number;
  last10: number | null;
  unit: string;
};

export type Dossier = {
  player: PlayerSummary;
  season: number;
  role: {
    id: RoleId;
    label: string;
  };
  fit: {
    grade: number;
    recommendation: FitRecommendation;
    verdict: string;
  };
  confidence: {
    level: ConfidenceLevel;
    gamesPlayed: number;
    minutesPerGame: number;
  };
  pillars: RolePillar[];
  callouts: Callout[];
  evidence: EvidenceMetric[];
  methodology: {
    scoringVersion: string;
    peerPoolSize: number;
    minMinutesForGame: number;
    notes: string[];
  };
};

export type PlayerSeasonLine = {
  playerId: PlayerId;
  firstName: string;
  lastName: string;
  position: string | null;
  teamAbbreviation: string | null;
  season: number;
  gamesPlayed: number;
  minutes: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fga: number;
  fg3a: number;
  fg3m: number;
  fg3Pct: number;
  /** Vendor league ranks (1 = best) when present. */
  ranks: {
    points: number | null;
    assists: number | null;
    rebounds: number | null;
    steals: number | null;
    blocks: number | null;
    fg3a: number | null;
    minutes: number | null;
  };
};

export type PlayerGameLine = {
  gameId: number;
  date: string;
  minutes: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fga: number;
  fg3a: number;
};
