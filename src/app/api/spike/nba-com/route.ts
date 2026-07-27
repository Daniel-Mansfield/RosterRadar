import { NextResponse } from "next/server";

/**
 * Temporary spike endpoint for Proof C (Vercel deploy test).
 * Remove or gate after vendor decision — not part of product API.
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

export async function GET(): Promise<NextResponse> {
  const url = new URL("https://stats.nba.com/stats/commonteamroster");
  url.searchParams.set("TeamID", String(NETS_TEAM_ID));
  url.searchParams.set("Season", SEASON);

  try {
    const response = await fetch(url, {
      headers: NBA_HEADERS,
      cache: "no-store",
    });
    const text = await response.text();
    const looksLikeHtml = /^\s*</.test(text);
    let playerCount = 0;
    let sample: Array<{ id: unknown; name: unknown; pos: unknown }> = [];

    if (response.ok && !looksLikeHtml) {
      try {
        const json: unknown = JSON.parse(text);
        const sets =
          typeof json === "object" &&
          json !== null &&
          "resultSets" in json &&
          Array.isArray((json as { resultSets: unknown }).resultSets)
            ? (json as { resultSets: Array<{ headers?: string[]; rowSet?: unknown[][] }> }).resultSets
            : [];
        const set = sets[0];
        if (set?.headers && set.rowSet) {
          const idx = {
            id: set.headers.indexOf("PLAYER_ID"),
            name: set.headers.indexOf("PLAYER"),
            pos: set.headers.indexOf("POSITION"),
          };
          playerCount = set.rowSet.length;
          sample = set.rowSet.slice(0, 5).map((row) => ({
            id: idx.id >= 0 ? row[idx.id] : null,
            name: idx.name >= 0 ? row[idx.name] : null,
            pos: idx.pos >= 0 ? row[idx.pos] : null,
          }));
        }
      } catch {
        // leave playerCount 0
      }
    }

    return NextResponse.json({
      proof: "C",
      ok: response.ok && !looksLikeHtml && playerCount > 0,
      status: response.status,
      looksLikeHtml,
      playerCount,
      sample,
      season: SEASON,
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
