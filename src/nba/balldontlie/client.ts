import { z } from "zod";

import type { PlayerGameLine, PlayerSeasonLine } from "@/domain/dossier";
import { AppError } from "@/domain/errors";
import type { NetsRoster, PlayerId, PlayerSummary, RosterPlayer } from "@/domain/player";
import { searchQuerySchema } from "@/lib/api/schemas";
import type { NbaStatsPort, SearchPlayersInput } from "@/nba/port";
import {
  BROOKLYN_NETS_ABBREVIATION,
  BROOKLYN_NETS_NAME,
  BROOKLYN_NETS_TEAM_ID,
  NETS_ROSTER_SEED,
  NETS_SEED_NAME_KEYS,
  STARTER_SLOTS,
  normalizePersonName,
  type NetsSeedEntry,
} from "@/nba/nets/rosterSeed";
import { parseMinutes } from "@/nba/parseMinutes";
import { isEspnAthleteId } from "@/nba/headshot";
import { attachEspnAthleteIds } from "@/nba/espn/attachEspnAthleteIds";
import {
  planPlayerSearch,
  playerMatchesSearchPlan,
} from "@/nba/playerSearchQuery";

import {
  balldontliePlayersResponseSchema,
  balldontlieSeasonAveragesResponseSchema,
  balldontlieStatsResponseSchema,
  type BalldontlieGameStat,
  type BalldontliePlayer,
  type BalldontlieSeasonAverage,
} from "./schemas";

const envSchema = z.object({
  BALLDONTLIE_API_KEY: z.string().min(1),
  BALLDONTLIE_BASE_URL: z.string().url().default("https://api.balldontlie.io"),
});

/** Extra normalized name keys so Nic ↔ Nicolas (etc.) still exclude as Nets. */
const NETS_ALIAS_NAME_KEYS: ReadonlySet<string> = new Set([
  ...NETS_SEED_NAME_KEYS,
  "nicolas|claxton",
  "cameron|thomas",
]);

const NETS_SEED_IDS: ReadonlySet<number> = new Set(
  NETS_ROSTER_SEED.map((entry) => entry.id).filter(
    (id): id is number => id != null,
  ),
);

function getConfig(): z.infer<typeof envSchema> {
  const parsed = envSchema.safeParse({
    BALLDONTLIE_API_KEY: process.env.BALLDONTLIE_API_KEY,
    BALLDONTLIE_BASE_URL: process.env.BALLDONTLIE_BASE_URL,
  });

  if (!parsed.success) {
    throw new AppError(
      "config_error",
      "Missing or invalid BALLDONTLIE_API_KEY. Copy .env.example to .env.local.",
      500,
    );
  }

  return parsed.data;
}

function toPlayerSummary(player: BalldontliePlayer): PlayerSummary {
  return {
    id: player.id,
    firstName: player.first_name,
    lastName: player.last_name,
    position: player.position ?? null,
    teamAbbreviation: player.team?.abbreviation ?? null,
    espnAthleteId: null,
  };
}

function seedNameKey(firstName: string, lastName: string): string {
  return `${normalizePersonName(firstName)}|${normalizePersonName(lastName)}`;
}

function isNetsPlayer(player: PlayerSummary): boolean {
  if (NETS_SEED_IDS.has(player.id)) return true;
  if (player.teamAbbreviation === BROOKLYN_NETS_ABBREVIATION) return true;
  return NETS_ALIAS_NAME_KEYS.has(
    seedNameKey(player.firstName, player.lastName),
  );
}

function assertValidNetsSeed(seed: readonly NetsSeedEntry[]): void {
  const starters = seed.filter((entry) => entry.slot !== "BENCH");
  if (starters.length !== STARTER_SLOTS.length) {
    throw new AppError(
      "invalid_payload",
      `Nets seed must have exactly ${STARTER_SLOTS.length} starters.`,
      500,
    );
  }

  const slots = new Set(starters.map((entry) => entry.slot));
  for (const slot of STARTER_SLOTS) {
    if (!slots.has(slot)) {
      throw new AppError(
        "invalid_payload",
        `Nets seed missing starter slot ${slot}.`,
        500,
      );
    }
  }

  if (slots.size !== STARTER_SLOTS.length) {
    throw new AppError(
      "invalid_payload",
      "Nets seed has duplicate starter slots.",
      500,
    );
  }

  const espnIds = new Set<number>();
  for (const entry of seed) {
    if (entry.espnAthleteId == null) continue;
    if (!isEspnAthleteId(entry.espnAthleteId)) {
      throw new AppError(
        "invalid_payload",
        `Nets seed has invalid espnAthleteId for ${entry.firstName} ${entry.lastName}.`,
        500,
      );
    }
    if (espnIds.has(entry.espnAthleteId)) {
      throw new AppError(
        "invalid_payload",
        `Nets seed has duplicate espnAthleteId ${entry.espnAthleteId}.`,
        500,
      );
    }
    espnIds.add(entry.espnAthleteId);
  }
}

function seedToRosterPlayer(entry: NetsSeedEntry): RosterPlayer {
  return {
    id: entry.id,
    espnAthleteId: entry.espnAthleteId,
    firstName: entry.firstName,
    lastName: entry.lastName,
    position: entry.position,
    teamAbbreviation: BROOKLYN_NETS_ABBREVIATION,
    slot: entry.slot,
  };
}

function toSeasonLine(row: BalldontlieSeasonAverage): PlayerSeasonLine {
  const stats = row.stats;
  return {
    playerId: row.player.id,
    firstName: row.player.first_name,
    lastName: row.player.last_name,
    position: row.player.position ?? null,
    teamAbbreviation: row.player.team?.abbreviation ?? null,
    season: row.season,
    gamesPlayed: stats.gp ?? 0,
    minutes: stats.min ?? 0,
    points: stats.pts ?? 0,
    assists: stats.ast ?? 0,
    rebounds: stats.reb ?? 0,
    steals: stats.stl ?? 0,
    blocks: stats.blk ?? 0,
    turnovers: stats.tov ?? 0,
    fga: stats.fga ?? 0,
    fg3a: stats.fg3a ?? 0,
    fg3m: stats.fg3m ?? 0,
    fg3Pct: stats.fg3_pct ?? 0,
    ranks: {
      points: stats.pts_rank ?? null,
      assists: stats.ast_rank ?? null,
      rebounds: stats.reb_rank ?? null,
      steals: stats.stl_rank ?? null,
      blocks: stats.blk_rank ?? null,
      fg3a: stats.fg3a_rank ?? null,
      minutes: stats.min_rank ?? null,
    },
  };
}

function toGameLine(row: BalldontlieGameStat): PlayerGameLine | null {
  if (!row.game) return null;
  return {
    gameId: row.game.id,
    date: row.game.date,
    minutes: parseMinutes(row.min),
    points: row.pts ?? 0,
    assists: row.ast ?? 0,
    rebounds: row.reb ?? 0,
    steals: row.stl ?? 0,
    blocks: row.blk ?? 0,
    turnovers: row.turnover ?? 0,
    fga: row.fga ?? 0,
    fg3a: row.fg3a ?? 0,
  };
}

async function balldontlieFetch(
  path: string,
  searchParams: Record<string, string | string[]>,
): Promise<unknown> {
  const config = getConfig();
  const url = new URL(path, config.BALLDONTLIE_BASE_URL);
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: config.BALLDONTLIE_API_KEY,
      },
      cache: "no-store",
    });
  } catch {
    throw new AppError("upstream", "Failed to reach BALLDONTLIE API.", 503);
  }

  if (response.status === 429) {
    throw new AppError(
      "rate_limited",
      "BALLDONTLIE trial rate limit reached (about 5 requests per minute). Wait ~60 seconds, then try again. Search and each dossier open use multiple API calls.",
      429,
    );
  }

  if (!response.ok) {
    throw new AppError(
      "upstream",
      `BALLDONTLIE returned HTTP ${response.status}.`,
      response.status >= 500 ? 503 : 502,
    );
  }

  return response.json() as Promise<unknown>;
}

export function createBalldontlieAdapter(): NbaStatsPort {
  return {
    async searchPlayers(input: SearchPlayersInput): Promise<PlayerSummary[]> {
      const parsedQuery = searchQuerySchema.safeParse(input.query);
      if (!parsedQuery.success) {
        const message =
          parsedQuery.error.issues[0]?.message ?? "Invalid search query.";
        throw new AppError("validation_error", message, 400);
      }

      // BDL matches one name field; multi-word queries need a plan + local filter.
      const plan = planPlayerSearch(parsedQuery.data);
      const refining =
        plan.firstNamePrefix != null || plan.lastNamePrefix != null;

      const json = await balldontlieFetch("/nba/v1/players", {
        search: plan.vendorSearch,
        // Wider page when we refine locally so the target is less likely to fall
        // outside the first vendor page (BDL max per_page is 100).
        per_page: refining ? "100" : "15",
      });

      const parsed = balldontliePlayersResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new AppError(
          "invalid_payload",
          "BALLDONTLIE players response failed schema validation.",
          502,
        );
      }

      let players = parsed.data.data.map(toPlayerSummary);
      if (refining) {
        players = players.filter((player) =>
          playerMatchesSearchPlan(player, plan),
        );
      }
      if (input.excludeNets) {
        players = players.filter((player) => !isNetsPlayer(player));
      }
      // Headshots are optional; curated + best-effort ESPN, never fail search.
      return attachEspnAthleteIds(players);
    },

    async getNetsRoster(): Promise<NetsRoster> {
      assertValidNetsSeed(NETS_ROSTER_SEED);
      const players = NETS_ROSTER_SEED.map(seedToRosterPlayer);

      return {
        teamId: BROOKLYN_NETS_TEAM_ID,
        teamAbbreviation: BROOKLYN_NETS_ABBREVIATION,
        teamName: BROOKLYN_NETS_NAME,
        starters: players.filter((player) => player.slot !== "BENCH"),
        bench: players.filter((player) => player.slot === "BENCH"),
      };
    },

    async getPlayerSeasonLine(
      playerId: PlayerId,
      season: number,
    ): Promise<PlayerSeasonLine | null> {
      const json = await balldontlieFetch(
        "/nba/v1/season_averages/general",
        {
          season: String(season),
          season_type: "regular",
          type: "base",
          "player_ids[]": [String(playerId)],
        },
      );

      const parsed = balldontlieSeasonAveragesResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new AppError(
          "invalid_payload",
          "BALLDONTLIE season averages failed schema validation.",
          502,
        );
      }

      const row = parsed.data.data[0];
      return row ? toSeasonLine(row) : null;
    },

    async getPlayerRecentGames(
      playerId: PlayerId,
      season: number,
      perPage = 30,
    ): Promise<PlayerGameLine[]> {
      const json = await balldontlieFetch("/nba/v1/stats", {
        "player_ids[]": [String(playerId)],
        "seasons[]": [String(season)],
        per_page: String(perPage),
      });

      const parsed = balldontlieStatsResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new AppError(
          "invalid_payload",
          "BALLDONTLIE game stats failed schema validation.",
          502,
        );
      }

      return parsed.data.data
        .map(toGameLine)
        .filter((g): g is PlayerGameLine => g != null)
        .sort((a, b) => b.date.localeCompare(a.date));
    },
  };
}
