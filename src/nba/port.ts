import type { NetsRoster, PlayerSummary } from "@/domain/player";

export type SearchPlayersInput = {
  query: string;
  /** When true, exclude Brooklyn Nets players (acquisition search). */
  excludeNets?: boolean;
};

export type NbaStatsPort = {
  searchPlayers: (input: SearchPlayersInput) => Promise<PlayerSummary[]>;
  getNetsRoster: () => Promise<NetsRoster>;
};
