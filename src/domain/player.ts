export type PlayerId = number;

export type PlayerSummary = {
  id: PlayerId;
  firstName: string;
  lastName: string;
  position: string | null;
  teamAbbreviation: string | null;
};

/** Court / bench placement for the Nets home view. */
export type CourtSlot = "PG" | "SG" | "SF" | "PF" | "C" | "BENCH";

export type RosterPlayer = PlayerSummary & {
  slot: CourtSlot;
};

export type NetsRoster = {
  teamId: number;
  teamAbbreviation: "BKN";
  teamName: string;
  starters: RosterPlayer[];
  bench: RosterPlayer[];
};

export type AppErrorCode =
  | "validation_error"
  | "not_found"
  | "upstream"
  | "invalid_payload"
  | "config_error";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string, status: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}
