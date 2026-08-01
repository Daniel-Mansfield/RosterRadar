import type { PlayerSummary } from "@/domain/player";
import { normalizePersonName } from "@/nba/nets/rosterSeed";

/**
 * How to query BALLDONTLIE for acquisition search.
 *
 * BDL `search` matches a single token against first *or* last name — not
 * "First Last". Multi-word queries must pick one vendor token and refine
 * locally, or common inputs like "LeBron J" return empty.
 */
export type PlayerSearchPlan = {
  /** Value sent as BDL `search`. */
  vendorSearch: string;
  /** When set, normalized first name must start with this. */
  firstNamePrefix: string | null;
  /** When set, normalized last name must start with this. */
  lastNamePrefix: string | null;
};

/**
 * Build a vendor search + local prefix filters from a validated query string.
 * Assumes the caller already ran `searchQuerySchema` (trim / length).
 */
export function planPlayerSearch(query: string): PlayerSearchPlan {
  const tokens = query.trim().split(/\s+/).filter((token) => token.length > 0);

  if (tokens.length <= 1) {
    return {
      vendorSearch: tokens[0] ?? query,
      firstNamePrefix: null,
      lastNamePrefix: null,
    };
  }

  const lastToken = tokens[tokens.length - 1] ?? "";
  const givenTokens = tokens.slice(0, -1);
  const firstPart = givenTokens.join(" ");
  const firstNamePrefix = normalizePersonName(firstPart);
  const lastNamePrefix = normalizePersonName(lastToken);

  // One-letter surname tokens are useless as BDL search (too broad / empty
  // after the space). Search a single given-name token and keep local filters.
  // Never send a spaced string as vendorSearch — BDL matches one field/token.
  if (lastNamePrefix.length < 2) {
    return {
      vendorSearch: givenTokens[0] ?? lastToken,
      firstNamePrefix: firstNamePrefix.length > 0 ? firstNamePrefix : null,
      lastNamePrefix: lastNamePrefix.length > 0 ? lastNamePrefix : null,
    };
  }

  return {
    vendorSearch: lastToken,
    firstNamePrefix: firstNamePrefix.length > 0 ? firstNamePrefix : null,
    lastNamePrefix: lastNamePrefix.length > 0 ? lastNamePrefix : null,
  };
}

export function playerMatchesSearchPlan(
  player: Pick<PlayerSummary, "firstName" | "lastName">,
  plan: PlayerSearchPlan,
): boolean {
  const first = normalizePersonName(player.firstName);
  const last = normalizePersonName(player.lastName);

  if (plan.firstNamePrefix != null && !first.startsWith(plan.firstNamePrefix)) {
    return false;
  }
  if (plan.lastNamePrefix != null && !last.startsWith(plan.lastNamePrefix)) {
    return false;
  }
  return true;
}
