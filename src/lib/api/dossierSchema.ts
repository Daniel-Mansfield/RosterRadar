import { z } from "zod";

/** Shared enums — keep dossier and team-fit payloads on the same vocabulary. */
export const pillarIdSchema = z.enum([
  "scoring",
  "playmaking",
  "rebounding",
  "spacing",
  "disruption",
  "workload",
]);

export const fitRecommendationSchema = z.enum([
  "strong",
  "conditional",
  "poor",
]);

export const calloutSchema = z.object({
  kind: z.enum(["strength", "risk"]),
  text: z.string(),
});

export const dossierSchema = z.object({
  player: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().nullable(),
    teamAbbreviation: z.string().nullable(),
  }),
  season: z.number(),
  role: z.object({
    id: z.enum([
      "primary_creator",
      "wing_scorer",
      "spacer",
      "connector",
      "paint_anchor",
      "versatile_forward",
    ]),
    label: z.string(),
  }),
  fit: z.object({
    grade: z.number(),
    recommendation: fitRecommendationSchema,
    verdict: z.string(),
  }),
  confidence: z.object({
    level: z.enum(["high", "medium", "low"]),
    thinSample: z.boolean(),
    gamesPlayed: z.number(),
    minutesPerGame: z.number(),
  }),
  pillars: z.array(
    z.object({
      id: pillarIdSchema,
      label: z.string(),
      percentile: z.number(),
      raw: z.number(),
      unit: z.string(),
    }),
  ),
  callouts: z.array(calloutSchema),
  evidence: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      season: z.number(),
      last10: z.number().nullable(),
      unit: z.string(),
    }),
  ),
  methodology: z.object({
    scoringVersion: z.string(),
    peerPoolSize: z.number(),
    minMinutesForGame: z.number(),
    notes: z.array(z.string()),
  }),
});

export const dossierApiResponseSchema = z.object({
  dossier: dossierSchema,
});
