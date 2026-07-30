import { z } from "zod";

import {
  calloutSchema,
  fitRecommendationSchema,
  pillarIdSchema,
} from "@/lib/api/dossierSchema";

export const teamFitSchema = z.object({
  season: z.number(),
  starters: z.array(
    z.object({
      playerId: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      position: z.string().nullable(),
      thinSample: z.boolean(),
    }),
  ),
  grade: z.number(),
  recommendation: fitRecommendationSchema,
  pillars: z.array(
    z.object({
      id: pillarIdSchema,
      label: z.string(),
      percentile: z.number(),
    }),
  ),
  callouts: z.array(calloutSchema),
  confidence: z.object({
    anyThinSample: z.boolean(),
    thinSampleNames: z.array(z.string()),
  }),
  methodology: z.object({
    scoringVersion: z.string(),
    notes: z.array(z.string()),
  }),
});

export const teamFitApiResponseSchema = z.object({
  teamFit: teamFitSchema,
});
