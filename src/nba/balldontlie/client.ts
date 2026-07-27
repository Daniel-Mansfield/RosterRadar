import { z } from "zod";

import { AppError } from "@/domain/errors";
import type { NetsRoster, PlayerSummary, RosterPlayer } from "@/domain/player";
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

function seedNameKey(firstName: string, lastName: string): string {
  return `${normalizePersonName(firstName)}|${normalizePersonName(lastName)}`;
}

/**
 * Acquisition filter: BKN abbreviation, or a name that matches the curated
 * Nets seed (covers null/stale team payloads for current Nets players).
 */
function isNetsPlayer(player: PlayerSummary): boolean {
  if (player.teamAbbreviation === BROOKLYN_NETS_ABBREVIATION) {
    return true;
  }
  return NETS_SEED_NAME_KEYS.has(
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
}

function seedToRosterPlayer(entry: NetsSeedEntry): RosterPlayer {
  return {
    id: entry.id,
    firstName: entry.firstName,
    lastName: entry.lastName,
    position: entry.position,
    teamAbbreviation: BROOKLYN_NETS_ABBREVIATION,
    slot: entry.slot,
  };
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
      const parsedQuery = searchQuerySchema.safeParse(input.query);
      if (!parsedQuery.success) {
        const message =
          parsedQuery.error.issues[0]?.message ??
          "Invalid search query.";
        throw new AppError("validation_error", message, 400);
      }

      const json = await balldontlieFetch("/nba/v1/players", {
        search: parsedQuery.data,
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
  };
}
