import { z } from "zod";

import { AppError, type NetsRoster, type PlayerSummary } from "@/domain/player";
import type { NbaStatsPort, SearchPlayersInput } from "@/nba/port";
import {
  BROOKLYN_NETS_ABBREVIATION,
  BROOKLYN_NETS_NAME,
  BROOKLYN_NETS_TEAM_ID,
  NETS_ROSTER_SEED,
} from "@/nba/nets/rosterSeed";

import {
  balldontliePlayersResponseSchema,
  type BalldontliePlayer,
} from "./schemas";

const envSchema = z.object({
  BALLDONTLIE_API_KEY: z.string().min(1),
  BALLDONTLIE_BASE_URL: z.string().url().default("https://api.balldontlie.io"),
});

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
  };
}

function isNetsPlayer(player: PlayerSummary): boolean {
  return player.teamAbbreviation === BROOKLYN_NETS_ABBREVIATION;
}

async function balldontlieFetch(
  path: string,
  searchParams: Record<string, string>,
): Promise<unknown> {
  const config = getConfig();
  const url = new URL(path, config.BALLDONTLIE_BASE_URL);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: config.BALLDONTLIE_API_KEY,
      },
      next: { revalidate: 60 },
    });
  } catch {
    throw new AppError("upstream", "Failed to reach BALLDONTLIE API.", 503);
  }

  if (response.status === 429) {
    throw new AppError(
      "upstream",
      "BALLDONTLIE rate limit hit. Try again shortly.",
      503,
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
      const query = input.query.trim();
      if (query.length < 2) {
        throw new AppError(
          "validation_error",
          "Search query must be at least 2 characters.",
          400,
        );
      }
      if (query.length > 64) {
        throw new AppError(
          "validation_error",
          "Search query must be at most 64 characters.",
          400,
        );
      }

      const json = await balldontlieFetch("/nba/v1/players", {
        search: query,
        per_page: "15",
      });

      const parsed = balldontliePlayersResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new AppError(
          "invalid_payload",
          "BALLDONTLIE players response failed schema validation.",
          502,
        );
      }

      const players = parsed.data.data.map(toPlayerSummary);
      if (input.excludeNets) {
        return players.filter((player) => !isNetsPlayer(player));
      }
      return players;
    },

    async getNetsRoster(): Promise<NetsRoster> {
      // Seed-backed: see rosterSeed.ts for why we don't use team_ids listing.
      const players = NETS_ROSTER_SEED.map((entry, index) => ({
        id: entry.id ?? -(index + 1),
        firstName: entry.firstName,
        lastName: entry.lastName,
        position: entry.position,
        teamAbbreviation: BROOKLYN_NETS_ABBREVIATION,
        slot: entry.slot,
      }));

      return {
        teamId: BROOKLYN_NETS_TEAM_ID,
        teamAbbreviation: BROOKLYN_NETS_ABBREVIATION,
        teamName: BROOKLYN_NETS_NAME,
        starters: players.filter((player) => player.slot !== "BENCH"),
        bench: players.filter((player) => player.slot === "BENCH"),
      };
    },
  };
}
