import { z } from "zod";

/** Shared search query rules (route + adapter). */
export const searchQuerySchema = z
  .string()
  .trim()
  .min(2, "Search query must be at least 2 characters.")
  .max(64, "Search query must be at most 64 characters.");

export const playerSummarySchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  position: z.string().nullable(),
  teamAbbreviation: z.string().nullable(),
  espnAthleteId: z.number().nullable(),
});

export const playersApiResponseSchema = z.object({
  players: z.array(playerSummarySchema),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type PlayersApiResponse = z.infer<typeof playersApiResponseSchema>;
