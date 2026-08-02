import { z } from "zod";

import { isEspnAthleteId } from "@/nba/headshot";
import { teamSubtitleMatches } from "@/nba/espn/teamHints";
import { normalizePersonName } from "@/nba/personName";

const ESPN_SEARCH_URL = "https://site.web.api.espn.com/apis/search/v2";

const espnPlayerContentSchema = z.object({
  displayName: z.string(),
  description: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  uid: z.string().optional().nullable(),
  link: z
    .object({
      web: z.string().optional(),
    })
    .optional(),
  image: z
    .object({
      default: z.string().optional(),
    })
    .optional(),
});

const espnSearchResponseSchema = z.object({
  results: z
    .array(
      z.object({
        type: z.string(),
        contents: z.array(espnPlayerContentSchema).optional(),
      }),
    )
    .optional(),
});

export type EspnAthleteResolveInput = {
  firstName: string;
  lastName: string;
  teamAbbreviation: string | null;
};

/**
 * Best-effort ESPN athlete id for headshots.
 * Returns null on network/schema/ambiguity — callers must keep initials fallback.
 */
export async function resolveEspnAthleteId(
  input: EspnAthleteResolveInput,
  options: { signal?: AbortSignal } = {},
): Promise<number | null> {
  const query = `${input.firstName} ${input.lastName}`.trim();
  if (query.length < 2) {
    return null;
  }

  const url = new URL(ESPN_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "8");

  let response: Response;
  try {
    response = await fetch(url, {
      signal: options.signal,
      headers: {
        Accept: "application/json",
        // Public site API; a browser-like UA reduces empty/blocked responses.
        "User-Agent":
          "RosterRadar/0.1 (+https://github.com/Daniel-Mansfield/RosterRadar)",
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return null;
  }

  return selectEspnAthleteIdFromSearch(json, input);
}

/** Pure selection from a vendor JSON payload (exported for tests). */
export function selectEspnAthleteIdFromSearch(
  json: unknown,
  input: EspnAthleteResolveInput,
): number | null {
  const parsed = espnSearchResponseSchema.safeParse(json);
  if (!parsed.success) {
    return null;
  }

  const targetName = normalizePersonName(`${input.firstName} ${input.lastName}`);
  const nbaHits: { id: number; teamOk: boolean }[] = [];

  for (const block of parsed.data.results ?? []) {
    if (block.type !== "player") continue;
    for (const content of block.contents ?? []) {
      if ((content.description ?? "").toUpperCase() !== "NBA") continue;
      if (normalizePersonName(content.displayName) !== targetName) continue;
      const id = parseEspnAthleteId(content);
      if (!isEspnAthleteId(id)) continue;
      nbaHits.push({
        id,
        teamOk: teamSubtitleMatches(content.subtitle, input.teamAbbreviation),
      });
    }
  }

  const teamMatched = nbaHits.filter((hit) => hit.teamOk);
  const pool = teamMatched.length > 0 ? teamMatched : nbaHits;
  if (pool.length === 0) {
    return null;
  }
  // Unique id only — ambiguous multi-id hits stay initials.
  const uniqueIds = [...new Set(pool.map((hit) => hit.id))];
  if (uniqueIds.length !== 1) {
    return null;
  }
  return uniqueIds[0] ?? null;
}

function parseEspnAthleteId(content: {
  uid?: string | null;
  link?: { web?: string };
  image?: { default?: string };
}): number | null {
  const web = content.link?.web ?? "";
  const fromWeb = web.match(/\/id\/(\d+)\//);
  if (fromWeb?.[1]) {
    const id = Number(fromWeb[1]);
    return isEspnAthleteId(id) ? id : null;
  }

  const image = content.image?.default ?? "";
  const fromImage = image.match(/\/full\/(\d+)\.png/i);
  if (fromImage?.[1]) {
    const id = Number(fromImage[1]);
    return isEspnAthleteId(id) ? id : null;
  }

  const uid = content.uid ?? "";
  const fromUid = uid.match(/~a:(\d+)\b/);
  if (fromUid?.[1]) {
    const id = Number(fromUid[1]);
    return isEspnAthleteId(id) ? id : null;
  }

  return null;
}
