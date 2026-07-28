/**
 * Freshness check for the "On the Radar" candidate pool.
 * Usage: npm run verify:radar   (run before demos; pool teams drift as players move)
 *
 * - One BALLDONTLIE request (all pool ids batched) checks ids resolve and
 *   team abbreviations still match.
 * - One ESPN search per candidate checks the headshot athlete id still
 *   resolves for that name.
 *
 * Reads BALLDONTLIE_API_KEY from .env.local — never prints the key.
 * Exits 1 on any mismatch so it can gate a demo-prep checklist.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { RADAR_POOL } from "../src/nba/radar/radarPool";
import { normalizePersonName } from "../src/nba/nets/rosterSeed";

function loadEnvLocal(): void {
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
      process.env[key] = value;
    }
  } catch {
    // rely on process.env only
  }
}

loadEnvLocal();

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const BASE = (
  process.env.BALLDONTLIE_BASE_URL ?? "https://api.balldontlie.io"
).replace(/\/$/, "");

type BdlPlayer = {
  id: number;
  first_name: string;
  last_name: string;
  team?: { abbreviation?: string };
};

async function fetchBdlPlayers(ids: number[]): Promise<Map<number, BdlPlayer>> {
  const url = new URL(`${BASE}/nba/v1/players`);
  url.searchParams.set("per_page", String(ids.length));
  for (const id of ids) {
    url.searchParams.append("player_ids[]", String(id));
  }
  const response = await fetch(url, {
    headers: { Authorization: API_KEY ?? "" },
  });
  if (!response.ok) {
    throw new Error(`BDL players request failed: ${response.status}`);
  }
  const json = (await response.json()) as { data?: BdlPlayer[] };
  return new Map((json.data ?? []).map((player) => [player.id, player]));
}

async function espnAthleteIds(query: string): Promise<number[]> {
  const url = new URL("https://site.web.api.espn.com/apis/search/v2");
  url.searchParams.set("region", "us");
  url.searchParams.set("lang", "en");
  url.searchParams.set("limit", "10");
  url.searchParams.set("query", query);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN search failed for "${query}": ${response.status}`);
  }
  const json = (await response.json()) as {
    results?: Array<{
      type?: string;
      contents?: Array<{ uid?: string }>;
    }>;
  };
  const ids: number[] = [];
  for (const group of json.results ?? []) {
    if (group.type !== "player") continue;
    for (const item of group.contents ?? []) {
      // uid format: "s:40~l:46~a:4278594" — l:46 is the NBA league.
      const uid = item.uid ?? "";
      if (!uid.includes("l:46")) continue;
      const athlete = uid.split("~").find((part) => part.startsWith("a:"));
      if (athlete) ids.push(Number(athlete.slice(2)));
    }
  }
  return ids;
}

async function main(): Promise<void> {
  console.log("RosterRadar radar-pool verify");
  console.log(new Date().toISOString());
  console.log(`pool_size=${RADAR_POOL.length}`);

  if (!API_KEY) {
    console.error("Missing BALLDONTLIE_API_KEY in .env.local");
    process.exit(1);
  }

  const failures: string[] = [];

  // 1. BDL: ids resolve, names match, teams have not drifted.
  const byId = await fetchBdlPlayers(RADAR_POOL.map((c) => c.id));
  for (const candidate of RADAR_POOL) {
    const label = `${candidate.firstName} ${candidate.lastName}`;
    const live = byId.get(candidate.id);
    if (!live) {
      failures.push(`[BDL] ${label}: id ${candidate.id} not found`);
      continue;
    }
    const nameMatches =
      normalizePersonName(live.first_name) ===
        normalizePersonName(candidate.firstName) &&
      normalizePersonName(live.last_name) ===
        normalizePersonName(candidate.lastName);
    if (!nameMatches) {
      failures.push(
        `[BDL] ${label}: id ${candidate.id} is "${live.first_name} ${live.last_name}"`,
      );
    }
    const liveTeam = live.team?.abbreviation ?? null;
    if (liveTeam !== candidate.teamAbbreviation) {
      failures.push(
        `[BDL] ${label}: team drifted ${candidate.teamAbbreviation} → ${liveTeam ?? "unknown"}`,
      );
    }
    if (liveTeam === "BKN") {
      failures.push(`[BDL] ${label}: now on the Nets — remove from pool`);
    }
  }
  console.log(`bdl_checked=${RADAR_POOL.length}`);

  // 2. ESPN: headshot id still resolves for the candidate's name.
  for (const candidate of RADAR_POOL) {
    const label = `${candidate.firstName} ${candidate.lastName}`;
    const ids = await espnAthleteIds(label);
    if (!ids.includes(candidate.espnAthleteId)) {
      failures.push(
        `[ESPN] ${label}: expected ${candidate.espnAthleteId}, search returned [${ids.join(", ")}]`,
      );
    }
    // Politeness delay; ESPN search is unauthenticated.
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`espn_checked=${RADAR_POOL.length}`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} problem(s):`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log("\nradar_pool_fresh=true");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
