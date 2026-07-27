import { NextResponse } from "next/server";

/**
 * Temporary spike endpoint for Proof C (Vercel deploy test).
 * Exercises the same stats.nba.com host used for roster capacity.
 * Remove after vendor decision.
 *
 * GET /api/spike/nba-com
 */
const NETS_TEAM_ID = 1610612751;
const SEASON = "2025-26";

const NBA_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
};

type Capacity = {
  name: string;
  ok: boolean;
  status: number;
  detail: string;
};

async function nbaGet(
  path: string,
  params: Record<string, string | number>,
): Promise<{ status: number; ok: boolean; json: unknown; looksLikeHtml: boolean }> {
  const url = new URL(path, "https://stats.nba.com");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers: NBA_HEADERS, cache: "no-store" });
  const text = await response.text();
  const looksLikeHtml = /^\s*</.test(text);
  let json: unknown = null;
  if (!looksLikeHtml) {
    try {
      json = JSON.parse(text);
    } catch {
      return { status: response.status, ok: false, json: null, looksLikeHtml: true };
    }
  }
  return {
    status: response.status,
    ok: response.ok && !looksLikeHtml && json != null,
    json,
    looksLikeHtml,
  };
}

function rowCount(json: unknown): number {
  if (
    typeof json !== "object" ||
    json === null ||
    !("resultSets" in json) ||
    !Array.isArray((json as { resultSets: unknown }).resultSets)
  ) {
    return 0;
  }
  const set = (json as { resultSets: Array<{ rowSet?: unknown[] }> }).resultSets[0];
  return set?.rowSet?.length ?? 0;
}

export async function GET(): Promise<NextResponse> {
  try {
    const roster = await nbaGet("/stats/commonteamroster", {
      TeamID: NETS_TEAM_ID,
      Season: SEASON,
    });
    const league = await nbaGet("/stats/leaguedashplayerstats", {
      College: "",
      Conference: "",
      Country: "",
      DateFrom: "",
      DateTo: "",
      Division: "",
      DraftPick: "",
      DraftYear: "",
      GameScope: "",
      GameSegment: "",
      Height: "",
      ISTRound: "",
      LastNGames: 0,
      LeagueID: "00",
      Location: "",
      MeasureType: "Base",
      Month: 0,
      OpponentTeamID: 0,
      Outcome: "",
      PORound: 0,
      PaceAdjust: "N",
      PerMode: "PerGame",
      Period: 0,
      PlayerExperience: "",
      PlayerPosition: "",
      PlusMinus: "N",
      Rank: "N",
      Season: SEASON,
      SeasonSegment: "",
      SeasonType: "Regular Season",
      ShotClockRange: "",
      StarterBench: "",
      TeamID: 0,
      VsConference: "",
      VsDivision: "",
      Weight: "",
    });
    const players = await nbaGet("/stats/commonallplayers", {
      LeagueID: "00",
      Season: SEASON,
      IsOnlyCurrentSeason: 1,
    });

    const capacities: Capacity[] = [
      {
        name: "roster",
        ok: roster.ok && rowCount(roster.json) > 0,
        status: roster.status,
        detail: `players=${rowCount(roster.json)} html=${roster.looksLikeHtml}`,
      },
      {
        name: "leagueDash",
        ok: league.ok && rowCount(league.json) > 100,
        status: league.status,
        detail: `players=${rowCount(league.json)} html=${league.looksLikeHtml}`,
      },
      {
        name: "playerDirectory",
        ok: players.ok && rowCount(players.json) > 100,
        status: players.status,
        detail: `players=${rowCount(players.json)} html=${players.looksLikeHtml}`,
      },
    ];

    const ok = capacities.every((c) => c.ok);
    return NextResponse.json({
      proof: "C",
      ok,
      season: SEASON,
      capacities,
      note: "Spike only — delete after vendor decision",
    });
  } catch (error) {
    return NextResponse.json(
      {
        proof: "C",
        ok: false,
        error: error instanceof Error ? error.message : "fetch failed",
      },
      { status: 503 },
    );
  }
}
