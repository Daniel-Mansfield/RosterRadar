import { z } from "zod";

import { pillarIdSchema } from "@/lib/api/dossierSchema";

export const radarScoresApiResponseSchema = z.object({
  pillar: z.object({
    id: pillarIdSchema,
    label: z.string().min(1),
  }),
  scores: z.array(
    z.object({
      playerId: z.number().int().positive(),
      percentile: z.number().int().min(0).max(99).nullable(),
    }),
  ),
});

export type RadarScoresApiResponse = z.infer<
  typeof radarScoresApiResponseSchema
>;
