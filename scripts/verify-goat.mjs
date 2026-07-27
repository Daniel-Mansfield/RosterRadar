/**
 * GOAT-tier entitlement check for RosterRadar Phase 2.
 * Usage: npm run verify:goat
 * Reads BALLDONTLIE_API_KEY from .env.local — never prints the key.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      // Prefer .env.local over any inherited empty/stale process.env value.
      process.env[key] = value;
    }
  } catch {
    // rely on process.env only
  }
}

loadEnvLocal();

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const BASE = (
  process.env.BALLDONTLIE_BASE_URL || "https://api.balldontlie.io"
).replace(/\/$/, "");

async function get(path, params = {}) {
  const full = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) full.searchParams.append(k, String(item));
    } else if (v != null) {
      full.searchParams.set(k, String(v));
    }
  }

  const started = Date.now();
  let response;
  try {
    response = await fetch(full, {
      headers: { Authorization: API_KEY ?? "" },
    });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      dataLen: null,
      sampleKeys: [],
      preview: error instanceof Error ? error.message : String(error),
      path: `${full.pathname}${full.search}`,
    };
  }

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  const dataLen = Array.isArray(json?.data) ? json.data.length : null;

  return {
    ok: response.ok,
    status: response.status,
    ms: Date.now() - started,
    dataLen,
    sampleKeys:
      json?.data?.[0] && typeof json.data[0] === "object"
        ? Object.keys(json.data[0]).slice(0, 14)
        : [],
    preview: text.slice(0, 180).replace(/\s+/g, " "),
    path: `${full.pathname}${full.search}`,
    json,
  };
}

async function main() {
  console.log("RosterRadar GOAT verify");
  console.log(new Date().toISOString());
  console.log(`base=${BASE}`);
  console.log(`key_present=${Boolean(API_KEY && API_KEY.length > 0)}`);

  if (!API_KEY) {
    console.error("Missing BALLDONTLIE_API_KEY in .env.local");
    process.exit(1);
  }

  /** @type {Array<Record<string, unknown>>} */
  const checks = [];

  async function run(name, path, params) {
    // GOAT trial is capped at ~5 req/min — pace probes.
    await new Promise((r) => setTimeout(r, 13000));
    const result = await get(path, params);
    const pass = result.ok && result.status === 200;
    checks.push({ name, pass, ...result, json: undefined });
    console.log(
      `\n[${pass ? "PASS" : "FAIL"}] ${name} status=${result.status} ms=${result.ms} dataLen=${result.dataLen}`,
    );
    console.log(`  ${result.path}`);
    if (!pass) console.log(`  preview=${result.preview}`);
    else if (result.sampleKeys.length)
      console.log(`  keys=${result.sampleKeys.join(",")}`);
    return result;
  }

  // Baseline search (no delay before first)
  {
    const result = await get("/nba/v1/players", {
      search: "Tatum",
      per_page: "5",
    });
    const pass = result.ok && result.status === 200;
    checks.push({
      name: "players_search",
      pass,
      ...result,
      json: undefined,
    });
    console.log(
      `\n[${pass ? "PASS" : "FAIL"}] players_search status=${result.status} ms=${result.ms} dataLen=${result.dataLen}`,
    );
    console.log(`  ${result.path}`);
    if (!pass) console.log(`  preview=${result.preview}`);
    else if (result.sampleKeys.length)
      console.log(`  keys=${result.sampleKeys.join(",")}`);

    const playerId = result.json?.data?.[0]?.id;
    if (playerId == null) {
      console.error("Could not resolve a sample player id from search");
      process.exit(1);
    }
    console.log(`\nusing_player_id=${playerId}`);

    await run("players_active_nba", "/nba/v1/players/active", {
      per_page: "5",
    });

    // One season averages + one stats probe (trial rate limit)
    await run("season_averages_2025", "/nba/v1/season_averages/general", {
      season: "2025",
      season_type: "regular",
      type: "base",
      "player_ids[]": [String(playerId)],
    });
    await run("stats_2025", "/nba/v1/stats", {
      "player_ids[]": [String(playerId)],
      "seasons[]": ["2025"],
      per_page: "15",
    });

    // Fallback prior season if 2025 empty but 200
    const avg = checks.find((c) => c.name === "season_averages_2025");
    const stats = checks.find((c) => c.name === "stats_2025");
    if (avg?.pass && Number(avg.dataLen) === 0) {
      await run("season_averages_2024", "/nba/v1/season_averages/general", {
        season: "2024",
        season_type: "regular",
        type: "base",
        "player_ids[]": [String(playerId)],
      });
    }
    if (stats?.pass && Number(stats.dataLen) === 0) {
      await run("stats_2024", "/nba/v1/stats", {
        "player_ids[]": [String(playerId)],
        "seasons[]": ["2024"],
        per_page: "15",
      });
    }
  }

  const summary = {
    players_search: Boolean(checks.find((c) => c.name === "players_search")?.pass),
    players_active: checks.some(
      (c) => String(c.name).startsWith("players_active") && c.pass,
    ),
    season_averages: checks.some(
      (c) =>
        String(c.name).startsWith("season_averages") &&
        c.pass &&
        Number(c.dataLen) > 0,
    ),
    game_stats: checks.some(
      (c) =>
        String(c.name).startsWith("stats_") &&
        c.pass &&
        Number(c.dataLen) > 0,
    ),
  };

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));

  const goatReady =
    summary.players_search &&
    summary.players_active &&
    summary.season_averages &&
    summary.game_stats;

  console.log(`\ngoat_phase2_ready=${goatReady}`);
  process.exit(goatReady ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
