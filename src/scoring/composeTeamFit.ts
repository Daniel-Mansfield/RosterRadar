import type { Callout, Dossier, PillarId } from "@/domain/dossier";
import type {
  TeamFit,
  TeamFitPillar,
  TeamFitStarter,
} from "@/domain/teamFit";
import { LINEUP_SIZE } from "@/domain/teamFit";
import { ordinal, recommendationFromGrade } from "@/scoring/composeDossier";

export const TEAM_FIT_SCORING_VERSION = "rr-lineup-fit-v1";

/** A lineup pillar at/above this average percentile reads as a strength. */
export const TEAM_STRENGTH_THRESHOLD = 70;

/** A lineup pillar at/below this average percentile reads as a gap. */
export const TEAM_GAP_THRESHOLD = 45;

export const MAX_TEAM_CALLOUTS_PER_KIND = 2;

/** Prefer at least this many insights when threshold callouts undershoot. */
export const TARGET_TEAM_CALLOUTS = 3;

export { LINEUP_SIZE };

/**
 * Compose a lineup-level fit read from the starters' individual dossiers.
 *
 * Semantics (agreed for v1):
 * - team pillar = unweighted mean of the starters' pillar percentiles
 * - lineup grade = unweighted mean of the six team pillars
 * - callouts flag pillar averages ≥ strength / ≤ gap thresholds, max two each
 * - any thin-sample starter caps the recommendation at Conditional
 *
 * Pure aggregation of individual profiles — no synergy or +/- modeling.
 */
export function composeTeamFit(dossiers: Dossier[]): TeamFit {
  if (dossiers.length === 0 || dossiers.length > LINEUP_SIZE) {
    throw new Error(
      `composeTeamFit requires 1–${LINEUP_SIZE} dossiers, got ${dossiers.length}.`,
    );
  }

  const [first] = dossiers;
  if (!first) {
    throw new Error("composeTeamFit requires at least one dossier.");
  }

  // Every dossier carries the same six pillars in the same order (buildPillars
  // is the single producer), so the first dossier defines id order and labels.
  const pillars: TeamFitPillar[] = first.pillars.map((pillar) => ({
    id: pillar.id,
    label: pillar.label,
    percentile: Math.round(
      mean(dossiers.map((d) => pillarPercentile(d, pillar.id))),
    ),
  }));

  const grade = Math.round(mean(pillars.map((p) => p.percentile)));

  const thinStarters = dossiers.filter((d) => d.confidence.thinSample);
  const anyThinSample = thinStarters.length > 0;

  const seasons = dossiers.map((d) => d.season);
  const season = Math.max(...seasons);
  const mixedSeasons = new Set(seasons).size > 1;

  const starters: TeamFitStarter[] = dossiers.map((d) => ({
    playerId: d.player.id,
    firstName: d.player.firstName,
    lastName: d.player.lastName,
    position: d.player.position,
    thinSample: d.confidence.thinSample,
  }));

  return {
    season,
    starters,
    grade,
    recommendation: recommendationFromGrade(grade, anyThinSample),
    pillars,
    callouts: buildTeamCallouts(pillars, dossiers),
    confidence: {
      anyThinSample,
      thinSampleNames: thinStarters.map(
        (d) => `${d.player.firstName} ${d.player.lastName}`,
      ),
    },
    methodology: {
      scoringVersion: TEAM_FIT_SCORING_VERSION,
      notes: [
        "Each lineup pillar is the unweighted mean of the starters' individual pillar percentiles (each vs league peers).",
        "Lineup grade is the unweighted mean of the six lineup pillars.",
        `Callouts flag lineup pillars at or above the ${ordinal(TEAM_STRENGTH_THRESHOLD)} percentile (strength) or at or below the ${ordinal(TEAM_GAP_THRESHOLD)} percentile (gap) — at most two of each.`,
        "A thin-sample starter caps the lineup read at Conditional; the grade itself stays honest.",
        "This aggregates individual profiles — it does not model on-court synergy, lineup plus-minus, or scheme.",
        ...(mixedSeasons
          ? [
              "Some starters' latest usable sample comes from a prior season; the lineup read mixes those seasons.",
            ]
          : []),
      ],
    },
  };
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function pillarPercentile(dossier: Dossier, id: PillarId): number {
  const pillar = dossier.pillars.find((p) => p.id === id);
  if (!pillar) {
    // Contract violation: buildPillars always emits all six pillars.
    throw new Error(
      `Dossier for player ${dossier.player.id} is missing pillar "${id}".`,
    );
  }
  return pillar.percentile;
}

function buildTeamCallouts(
  pillars: TeamFitPillar[],
  dossiers: Dossier[],
): Callout[] {
  const used = new Set<PillarId>();

  const strengths = pillars
    .filter((p) => p.percentile >= TEAM_STRENGTH_THRESHOLD)
    .sort((a, b) => b.percentile - a.percentile)
    .slice(0, MAX_TEAM_CALLOUTS_PER_KIND)
    .map((p): Callout => {
      used.add(p.id);
      const leader = topStarter(dossiers, p.id);
      return {
        kind: "strength",
        text: `${p.label} is a lineup strength — the starters average the ${ordinal(p.percentile)} percentile, led by ${leader.name} (${ordinal(leader.percentile)}).`,
      };
    });

  const gaps = pillars
    .filter((p) => p.percentile <= TEAM_GAP_THRESHOLD)
    .sort((a, b) => a.percentile - b.percentile)
    .slice(0, MAX_TEAM_CALLOUTS_PER_KIND)
    .map((p): Callout => {
      used.add(p.id);
      const best = topStarter(dossiers, p.id);
      return {
        kind: "risk",
        text: `${p.label} is a lineup gap — the starters average the ${ordinal(p.percentile)} percentile; no starter tops the ${ordinal(best.percentile)}.`,
      };
    });

  const callouts = [...strengths, ...gaps];

  // When threshold flags undershoot, add the next-most-extreme unused pillar
  // as a softer insight so the home rail has enough to read. Mid-band pillars
  // (between gap and 50) are skipped — they are not strengths or gaps.
  while (callouts.length > 0 && callouts.length < TARGET_TEAM_CALLOUTS) {
    const next = pillars
      .filter(
        (p) =>
          !used.has(p.id) &&
          (p.percentile >= 50 || p.percentile <= TEAM_GAP_THRESHOLD),
      )
      .sort(
        (a, b) =>
          Math.abs(b.percentile - 50) - Math.abs(a.percentile - 50) ||
          b.percentile - a.percentile,
      )[0];
    if (!next) break;
    used.add(next.id);
    const leader = topStarter(dossiers, next.id);
    if (next.percentile >= 50) {
      callouts.push({
        kind: "strength",
        text: `${next.label} is solid on paper — the starters average the ${ordinal(next.percentile)} percentile, led by ${leader.name} (${ordinal(leader.percentile)}).`,
      });
    } else {
      callouts.push({
        kind: "risk",
        text: `${next.label} is a relative soft spot — the starters average the ${ordinal(next.percentile)} percentile; no starter tops the ${ordinal(leader.percentile)}.`,
      });
    }
  }

  return callouts;
}

/** Starter with the highest percentile in a pillar. */
function topStarter(
  dossiers: Dossier[],
  id: PillarId,
): { name: string; percentile: number } {
  const [head, ...rest] = dossiers;
  if (!head) {
    throw new Error("topStarter requires at least one dossier.");
  }
  let best = head;
  let bestPct = pillarPercentile(best, id);
  for (const d of rest) {
    const pct = pillarPercentile(d, id);
    if (pct > bestPct) {
      best = d;
      bestPct = pct;
    }
  }
  return {
    name: `${best.player.firstName} ${best.player.lastName}`,
    percentile: bestPct,
  };
}
