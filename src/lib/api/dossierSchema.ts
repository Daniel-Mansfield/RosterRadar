import { z } from "zod";

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
    recommendation: z.enum(["strong", "conditional", "poor"]),
    verdict: z.string(),
  }),
  confidence: z.object({
    level: z.enum(["high", "medium", "low"]),
    gamesPlayed: z.number(),
    minutesPerGame: z.number(),
  }),
  pillars: z.array(
    z.object({
      id: z.enum([
        "scoring",
        "playmaking",
        "rebounding",
        "spacing",
        "disruption",
        "workload",
      ]),
      label: z.string(),
      percentile: z.number(),
      raw: z.number(),
      unit: z.string(),
    }),
  ),
  callouts: z.array(
    z.object({
      kind: z.enum(["strength", "risk"]),
      text: z.string(),
    }),
  ),
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
