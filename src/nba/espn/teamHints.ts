/**
 * Loose ESPN subtitle hints for BDL team abbreviations.
 * Used only to disambiguate same-name search hits — not a full franchise model.
 */
export const NBA_TEAM_SUBTITLE_HINTS: Readonly<Record<string, readonly string[]>> =
  {
    ATL: ["hawks", "atlanta"],
    BOS: ["celtics", "boston"],
    BKN: ["nets", "brooklyn"],
    CHA: ["hornets", "charlotte"],
    CHI: ["bulls", "chicago"],
    CLE: ["cavaliers", "cavs", "cleveland"],
    DAL: ["mavericks", "mavs", "dallas"],
    DEN: ["nuggets", "denver"],
    DET: ["pistons", "detroit"],
    GSW: ["warriors", "golden state"],
    HOU: ["rockets", "houston"],
    IND: ["pacers", "indiana"],
    LAC: ["clippers"],
    LAL: ["lakers"],
    MEM: ["grizzlies", "memphis"],
    MIA: ["heat", "miami"],
    MIL: ["bucks", "milwaukee"],
    MIN: ["timberwolves", "wolves", "minnesota"],
    NOP: ["pelicans", "new orleans"],
    NYK: ["knicks", "new york"],
    OKC: ["thunder", "oklahoma"],
    ORL: ["magic", "orlando"],
    PHI: ["76ers", "sixers", "philadelphia"],
    PHX: ["suns", "phoenix"],
    POR: ["blazers", "trail blazers", "portland"],
    SAC: ["kings", "sacramento"],
    SAS: ["spurs", "san antonio"],
    TOR: ["raptors", "toronto"],
    UTA: ["jazz", "utah"],
    WAS: ["wizards", "washington"],
  };

export function teamSubtitleMatches(
  subtitle: string | null | undefined,
  teamAbbreviation: string | null,
): boolean {
  if (teamAbbreviation == null || teamAbbreviation.trim() === "") {
    return true;
  }
  const hints = NBA_TEAM_SUBTITLE_HINTS[teamAbbreviation.toUpperCase()];
  if (!hints) {
    return true;
  }
  const haystack = (subtitle ?? "").toLowerCase();
  if (haystack.length === 0) {
    return true;
  }
  return hints.some((hint) => haystack.includes(hint));
}
