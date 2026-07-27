/**
 * Bounded NBA.com stats spike — capacities RosterRadar needs.
 * Usage: npm run spike:nba-com
 *
 * Proofs:
 *   A — Nets roster (commonteamroster)
 *   B — Season averages + game log (playercareerstats, playergamelog)
 *   D — Player directory / search (commonallplayers) for acquisition search
 *   E — League-wide season stats (leaguedashplayerstats) for peer percentiles
 *
 * Proof C (Vercel) is separate — hit GET /api/spike/nba-com on a preview deploy.
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
  console.log("\n=== Proof A: Nets roster ===");
  for (const season of SEASON_CANDIDATES) {
    const res = await nbaGet("/stats/commonteamroster", {
      TeamID: NETS_TEAM_ID,
      Season: season,
    });
    console.log(
      `season=${season} status=${res.status} ok=${res.ok} ms=${res.ms}`,
    );
    if (!res.ok) {
      console.log(`  preview: ${res.preview}`);
      continue;
    }
    const rows = resultSetToRows(res.json, "CommonTeamRoster") ?? [];
    const sample = rows.slice(0, 6).map((r) => ({
      id: r.PLAYER_ID,
      name: r.PLAYER,
      pos: r.POSITION,
    }));
    console.log(`  players=${rows.length}`, JSON.stringify(sample));
    return {
      pass: rows.length > 0,
      season,
      playerCount: rows.length,
      sample,
      firstPlayerId: rows[0]?.PLAYER_ID ?? null,
      netsIds: new Set(rows.map((r) => r.PLAYER_ID)),
    };
  }
  return {
    pass: false,
    season: null,
    playerCount: 0,
    sample: [],
    firstPlayerId: null,
    netsIds: new Set(),
  };
}

async function proofB(playerId) {
  console.log("\n=== Proof B: season averages + game log ===");
  if (playerId == null) {
    return { pass: false, reason: "no_player_id" };
  }

  let seasonOk = false;
  let gameLogOk = false;
  let seasonSample = null;
  let gameLogCount = 0;
  let usedSeason = null;

  const career = await nbaGet("/stats/playercareerstats", {
    PlayerID: playerId,
    PerMode: "PerGame",
  });
  console.log(
    `playercareerstats status=${career.status} ok=${career.ok} ms=${career.ms}`,
  );
  if (career.ok) {
    const seasonTotals =
      resultSetToRows(career.json, "SeasonTotalsRegularSeason") ?? [];
    const match = seasonTotals[seasonTotals.length - 1];
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
      };
      console.log("  season:", JSON.stringify(seasonSample));
    }
  }

  for (const season of SEASON_CANDIDATES) {
    const log = await nbaGet("/stats/playergamelog", {
      PlayerID: playerId,
      Season: season,
      SeasonType: "Regular Season",
    });
    console.log(
      `playergamelog season=${season} status=${log.status} ok=${log.ok} ms=${log.ms}`,
    );
    if (!log.ok) continue;
    const games = resultSetToRows(log.json, "PlayerGameLog") ?? [];
    if (games.length > 0) {
      gameLogOk = true;
      gameLogCount = games.length;
      usedSeason = usedSeason ?? season;
      console.log(
        `  games=${games.length} latest=`,
        JSON.stringify({
          date: games[0]?.GAME_DATE,
          pts: games[0]?.PTS,
          min: games[0]?.MIN,
        }),
      );
      break;
    }
  }

  return {
    pass: seasonOk && gameLogOk,
    playerId,
    usedSeason,
    seasonOk,
    gameLogOk,
    seasonSample,
    gameLogCount,
  };
}

/** Strip diacritics so "doncic" matches "Dončić". */
function normalizeName(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Acquisition search capacity: filter a player directory by name. */
async function proofD(netsIds) {
  console.log("\n=== Proof D: player directory / name search ===");
  let rows = [];
  let seasonUsed = null;

  for (const season of SEASON_CANDIDATES) {
    const res = await nbaGet("/stats/commonallplayers", {
      LeagueID: "00",
      Season: season,
      IsOnlyCurrentSeason: 1,
    });
    console.log(
      `commonallplayers season=${season} status=${res.status} ok=${res.ok} ms=${res.ms}`,
    );
    if (!res.ok) {
      console.log(`  preview: ${res.preview}`);
      continue;
    }
    rows = resultSetToRows(res.json, "CommonAllPlayers") ?? [];
    if (rows.length > 0) {
      seasonUsed = season;
      break;
    }
  }

  if (rows.length === 0) {
    return { pass: false, count: 0, queries: {} };
  }

  const queries = ["tatum", "doncic", "curry"];
  const byQuery = {};
  for (const query of queries) {
    const needle = normalizeName(query);
    const matches = rows
      .filter((r) => normalizeName(r.DISPLAY_FIRST_LAST ?? "").includes(needle))
      .slice(0, 5)
      .map((r) => ({
        id: r.PERSON_ID,
        name: r.DISPLAY_FIRST_LAST,
        team: r.TEAM_ABBREVIATION,
        rosterStatus: r.ROSTERSTATUS,
      }));
    const nonNets = matches.filter((m) => !netsIds.has(m.id));
    byQuery[query] = { matches, nonNetsCount: nonNets.length };
    console.log(
      `  query="${query}" hits=${matches.length} nonNets=${nonNets.length}`,
      JSON.stringify(matches),
    );
  }

  const anyHits = queries.some((q) => byQuery[q].matches.length > 0);
  return {
    pass: rows.length > 100 && anyHits,
    season: seasonUsed,
    count: rows.length,
    queries: byQuery,
    note: "ASCII queries need diacritic-insensitive match (Dončić)",
  };
}

/** Peer-percentile capacity: league-wide per-player season stats. */
async function proofE() {
  console.log("\n=== Proof E: league dash (peer percentiles) ===");
  for (const season of SEASON_CANDIDATES) {
    const res = await nbaGet("/stats/leaguedashplayerstats", {
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
      Season: season,
      SeasonSegment: "",
      SeasonType: "Regular Season",
      ShotClockRange: "",
      StarterBench: "",
      TeamID: 0,
      VsConference: "",
      VsDivision: "",
      Weight: "",
    });
    console.log(
      `leaguedashplayerstats season=${season} status=${res.status} ok=${res.ok} ms=${res.ms}`,
    );
    if (!res.ok) {
      console.log(`  preview: ${res.preview}`);
      continue;
    }
    const rows = resultSetToRows(res.json, "LeagueDashPlayerStats") ?? [];
    const sample = rows.slice(0, 3).map((r) => ({
      id: r.PLAYER_ID,
      name: r.PLAYER_NAME,
      team: r.TEAM_ABBREVIATION,
      gp: r.GP,
      min: r.MIN,
      pts: r.PTS,
      ast: r.AST,
      reb: r.REB,
    }));
    // Fields useful for role pillars later
    const headers = res.json?.resultSets?.[0]?.headers ?? [];
    const pillarish = [
      "PTS",
      "AST",
      "REB",
      "STL",
      "BLK",
      "FG3M",
      "FG3_PCT",
      "FT_PCT",
      "TOV",
      "PLUS_MINUS",
    ].filter((h) => headers.includes(h));
    console.log(`  players=${rows.length} pillarFields=`, pillarish.join(","));
    console.log("  sample:", JSON.stringify(sample));
    return {
      pass: rows.length > 100,
      season,
      playerCount: rows.length,
      pillarFields: pillarish,
      sample,
    };
  }
  return { pass: false, season: null, playerCount: 0, pillarFields: [], sample: [] };
}

async function main() {
  console.log("RosterRadar NBA.com capacity spike");
  console.log(new Date().toISOString());

  const a = await proofA();
  const b = await proofB(a.firstPlayerId);
  const d = await proofD(a.netsIds ?? new Set());
  const e = await proofE();

  const summary = {
    proofA_roster: a.pass ? "PASS" : "FAIL",
    proofB_seasonGameLog: b.pass ? "PASS" : "FAIL",
    proofD_playerSearch: d.pass ? "PASS" : "FAIL",
    proofE_leagueDashPercentiles: e.pass ? "PASS" : "FAIL",
    proofC_vercel: "NOT_RUN",
    localCapacitiesReady: a.pass && b.pass && d.pass && e.pass,
  };

  console.log("\n=== Summary ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log("\n=== RESULT_JSON ===");
  console.log(
    JSON.stringify(
      {
        a: { ...a, netsIds: undefined },
        b,
        d,
        e,
        summary,
      },
      null,
      2,
    ),
  );

  process.exit(summary.localCapacitiesReady ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
