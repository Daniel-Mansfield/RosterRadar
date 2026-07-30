import type {
  Callout,
  FitRecommendation,
  PillarId,
} from "@/domain/dossier";
import type { PlayerId } from "@/domain/player";

/** Starters required for a full lineup-fit read on the Nets home panel. */
export const LINEUP_SIZE = 5;

/** One of the six role pillars, averaged across the starting lineup. */
export type TeamFitPillar = {
  id: PillarId;
  label: string;
  /** Unweighted mean of the starters' percentiles for this pillar. */
  percentile: number;
};

export type TeamFitStarter = {
  playerId: PlayerId;
  firstName: string;
  lastName: string;
  position: string | null;
  thinSample: boolean;
};

/**
 * Lineup-level fit read for a set of starters.
 *
 * This is an aggregation of individual player profiles vs league peers —
 * deliberately framed as "Lineup Fit", never a synergy or +/- projection.
 */
export type TeamFit = {
  /** Latest season used across the lineup (starters may fall back a season). */
  season: number;
  starters: TeamFitStarter[];
  /** Unweighted mean of the six team pillars. */
  grade: number;
  recommendation: FitRecommendation;
  pillars: TeamFitPillar[];
  /** Balance callouts: up to two strengths + two gaps; pads to three when sparse. */
  callouts: Callout[];
  confidence: {
    anyThinSample: boolean;
    /** Display names of starters whose individual sample is thin. */
    thinSampleNames: string[];
  };
  methodology: {
    scoringVersion: string;
    notes: string[];
  };
};
