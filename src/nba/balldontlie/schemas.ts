import { z } from "zod";

export const balldontlieTeamSchema = z.object({
  id: z.number(),
  abbreviation: z.string(),
  full_name: z.string().optional(),
});

export const balldontliePlayerSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  position: z.string().nullable().optional(),
  team: balldontlieTeamSchema.nullable().optional(),
  team_id: z.number().optional(),
});

export const balldontliePlayersResponseSchema = z.object({
  data: z.array(balldontliePlayerSchema),
  meta: z
    .object({
      next_cursor: z.number().nullable().optional(),
      per_page: z.number().optional(),
    })
    .optional(),
});

export const balldontlieSeasonStatsSchema = z.object({
  gp: z.number().optional(),
  min: z.number().optional(),
  pts: z.number().optional(),
  ast: z.number().optional(),
  reb: z.number().optional(),
  stl: z.number().optional(),
  blk: z.number().optional(),
  tov: z.number().optional(),
  fga: z.number().optional(),
  fg3a: z.number().optional(),
  fg3m: z.number().optional(),
  fg3_pct: z.number().optional(),
  pts_rank: z.number().optional(),
  ast_rank: z.number().optional(),
  reb_rank: z.number().optional(),
  stl_rank: z.number().optional(),
  blk_rank: z.number().optional(),
  fg3a_rank: z.number().optional(),
  min_rank: z.number().optional(),
});

export const balldontlieSeasonAverageSchema = z.object({
  player: balldontliePlayerSchema,
  season: z.number(),
  season_type: z.string().optional(),
  stats: balldontlieSeasonStatsSchema,
});

export const balldontlieSeasonAveragesResponseSchema = z.object({
  data: z.array(balldontlieSeasonAverageSchema),
  meta: z
    .object({
      per_page: z.number().optional(),
      next_cursor: z.number().nullable().optional(),
    })
    .optional(),
});

export const balldontlieGameStatSchema = z.object({
  id: z.number(),
  min: z.union([z.string(), z.number()]).nullable().optional(),
  pts: z.number().optional(),
  ast: z.number().optional(),
  reb: z.number().optional(),
  stl: z.number().optional(),
  blk: z.number().optional(),
  turnover: z.number().optional(),
  fga: z.number().optional(),
  fg3a: z.number().optional(),
  game: z
    .object({
      id: z.number(),
      date: z.string(),
    })
    .optional(),
});

export const balldontlieStatsResponseSchema = z.object({
  data: z.array(balldontlieGameStatSchema),
  meta: z
    .object({
      next_cursor: z.number().nullable().optional(),
      per_page: z.number().optional(),
    })
    .optional(),
});

export type BalldontliePlayer = z.infer<typeof balldontliePlayerSchema>;
export type BalldontlieSeasonAverage = z.infer<
  typeof balldontlieSeasonAverageSchema
>;
export type BalldontlieGameStat = z.infer<typeof balldontlieGameStatSchema>;
