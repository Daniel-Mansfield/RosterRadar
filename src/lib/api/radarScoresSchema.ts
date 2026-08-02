import { z } from "zod";

export const radarScoresApiResponseSchema = z.object({
  pillar: z.object({
    id: z.enum([
      "scoring",
      "playmaking",
      "rebounding",
      "spacing",
      "disruption",
      "workload",
    ]),
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
