import { z } from "zod";

export const balldontlieTeamSchema = z
  .object({
    id: z.number(),
    abbreviation: z.string(),
    full_name: z.string().optional(),
  })
  .passthrough();

export const balldontliePlayerSchema = z
  .object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    position: z.string().nullable().optional(),
    team: balldontlieTeamSchema.nullable().optional(),
  })
  .passthrough();

export const balldontliePlayersResponseSchema = z.object({
  data: z.array(balldontliePlayerSchema),
  meta: z
    .object({
      next_cursor: z.number().nullable().optional(),
      per_page: z.number().optional(),
    })
    .passthrough()
    .optional(),
});

export type BalldontliePlayer = z.infer<typeof balldontliePlayerSchema>;
