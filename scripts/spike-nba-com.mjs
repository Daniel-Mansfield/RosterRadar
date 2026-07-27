/**
 * Bounded NBA.com stats spike (Proof A + B).
 * Usage: node scripts/spike-nba-com.mjs
 *
 * No API key. Uses public stats.nba.com endpoints with browser-like headers.
 * See docs/SPIKE_NBA_COM.md.
 */

const NETS_TEAM_ID = 1610612751;
const SEASON_CANDIDATES = ["2025-26", "2024-25"];

const NBA_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Connection: "keep-alive",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
};

function resultSetToRows(payload, setName) {
  const sets = payload?.resultSets;
  if (!Array.isArray(sets)) return null;
  const set =
    (setName ? sets.find((s) => s.name === setName) : null) ?? sets[0];
  if (!set?.headers || !set?.rowSet) return null;
  return set.rowSet.map((row) => {
    const obj = {};
    for (let i = 0; i < set.headers.length; i++) {
      obj[set.headers[i]] = row[i];
    }
    return obj;
  });
}

async function nbaGet(path, params) {
  const url = new URL(path, "https://stats.nba.com");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const started = Date.now();
  let response;
  try {
    response = await fetch(url, { headers: NBA_HEADERS });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
      url: url.toString(),
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const ms = Date.now() - started;

  let json = null;
  let looksLikeHtml = /^\s*</.test(text) || contentType.includes("text/html");
  if (!looksLikeHtml) {
    try {
      json = JSON.parse(text);
    } catch {
      looksLikeHtml = true;
    }
  }

  return {
    ok: response.ok && json != null && !looksLikeHtml,
    status: response.status,
    ms,
    url: url.toString(),
    looksLikeHtml,
    json,
    preview: text.slice(0, 180).replace(/\s+/g, " "),
  };
}

async function proofA() {
  console.log("\n=== Proof A: Nets roster (local) ===");
  for (const season of SEASON_CANDIDATES) {
    const res = await nbaGet("/stats/commonteamroster", {
      TeamID: NETS_TEAM_ID,
      Season: season,
    });

    console.log(
      `season=${season} status=${res.status} ok=${res.ok} ms=${res.ms} html=${Boolean(res.looksLikeHtml)}`,
    );
    if (!res.ok) {
      console.log(`  preview: ${res.preview}`);
      if (res.error) console.log(`  error: ${res.error}`);
      continue;
    }

    const rows = resultSetToRows(res.json, "CommonTeamRoster") ?? [];
    const sample = rows.slice(0, 8).map((r) => ({
      id: r.PLAYER_ID,
      name: r.PLAYER,
      num: r.NUM,
      pos: r.POSITION,
      height: r.HEIGHT,
    }));
    console.log(`  players=${rows.length}`);
    console.log("  sample:", JSON.stringify(sample, null, 2));
    return {
      pass: rows.length > 0,
      season,
      playerCount: rows.length,
      sample,
      firstPlayerId: rows[0]?.PLAYER_ID ?? null,
    };
  }
  return { pass: false, season: null, playerCount: 0, sample: [], firstPlayerId: null };
}

async function proofB(playerId) {
  console.log("\n=== Proof B: season averages + game log (local) ===");
  if (playerId == null) {
    console.log("  skipped — no player id from Proof A");
    return { pass: false, reason: "no_player_id" };
  }

  let seasonOk = false;
  let gameLogOk = false;
  let seasonSample = null;
  let gameLogSample = null;
  let usedSeason = null;

  for (const season of SEASON_CANDIDATES) {
    const career = await nbaGet("/stats/playercareerstats", {
      PlayerID: playerId,
      PerMode: "PerGame",
    });
    console.log(
      `playercareerstats player=${playerId} status=${career.status} ok=${career.ok} ms=${career.ms}`,
    );
    if (career.ok) {
      const seasonTotals =
        resultSetToRows(career.json, "SeasonTotalsRegularSeason") ?? [];
      const match =
        seasonTotals.find((r) => String(r.SEASON_ID).includes(season.slice(2, 4)) || String(r.SEASON_ID) === season) ??
        seasonTotals[seasonTotals.length - 1];
      if (match) {
        seasonOk = true;
        usedSeason = String(match.SEASON_ID);
        seasonSample = {
          season: match.SEASON_ID,
          team: match.TEAM_ABBREVIATION,
          gp: match.GP,
          pts: match.PTS,
          reb: match.REB,
          ast: match.AST,
          min: match.MIN,
        };
        console.log("  season sample:", JSON.stringify(seasonSample));
      }
    } else {
      console.log(`  preview: ${career.preview}`);
    }

    const log = await nbaGet("/stats/playergamelog", {
      PlayerID: playerId,
      Season: season,
      SeasonType: "Regular Season",
    });
    console.log(
      `playergamelog season=${season} status=${log.status} ok=${log.ok} ms=${log.ms}`,
    );
    if (log.ok) {
      const games = resultSetToRows(log.json, "PlayerGameLog") ?? [];
      const last10 = games.slice(0, 10).map((g) => ({
        date: g.GAME_DATE,
        matchup: g.MATCHUP,
        min: g.MIN,
        pts: g.PTS,
        reb: g.REB,
        ast: g.AST,
      }));
      if (games.length > 0) {
        gameLogOk = true;
        usedSeason = usedSeason ?? season;
        gameLogSample = { count: games.length, last10 };
        console.log(`  games=${games.length}`);
        console.log("  last few:", JSON.stringify(last10.slice(0, 3)));
        break;
      }
      console.log("  empty game log for season");
    } else {
      console.log(`  preview: ${log.preview}`);
    }
  }

  return {
    pass: seasonOk && gameLogOk,
    playerId,
    usedSeason,
    seasonOk,
    gameLogOk,
    seasonSample,
    gameLogSample,
  };
}

async function main() {
  console.log("RosterRadar NBA.com spike — Proof A + B");
  console.log(new Date().toISOString());

  const a = await proofA();
  const b = await proofB(a.firstPlayerId);

  const summary = {
    proofA: a.pass ? "PASS" : "FAIL",
    proofB: b.pass ? "PASS" : "FAIL",
    proofC: "NOT_RUN",
    localReadyForAdapter: a.pass && b.pass,
  };
  console.log("\n=== Summary ===");
  console.log(JSON.stringify(summary, null, 2));

  // Machine-readable blob for docs update
  console.log("\n=== RESULT_JSON ===");
  console.log(JSON.stringify({ a, b, summary }, null, 2));

  process.exit(a.pass && b.pass ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
