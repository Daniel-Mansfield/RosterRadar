import type { PlayerGameLine, PlayerSeasonLine } from "@/domain/dossier";
import type { NetsRoster, PlayerId, PlayerSummary } from "@/domain/player";

export type SearchPlayersInput = {
  query: string;
  /** When true, exclude Brooklyn Nets players (acquisition search). */
  excludeNets?: boolean;
};

export type NbaStatsPort = {
  searchPlayers: (input: SearchPlayersInput) => Promise<PlayerSummary[]>;
  getNetsRoster: () => Promise<NetsRoster>;
  getPlayerSeasonLine: (
    playerId: PlayerId,
    season: number,
  ) => Promise<PlayerSeasonLine | null>;
  getPlayerRecentGames: (
    playerId: PlayerId,
    season: number,
    perPage?: number,
  ) => Promise<PlayerGameLine[]>;
};
