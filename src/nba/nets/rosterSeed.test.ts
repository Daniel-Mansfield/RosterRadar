import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NETS_SEED_NAME_KEYS } from "@/nba/nets/rosterSeed";
import { normalizePersonName } from "@/nba/personName";

describe("NETS_SEED_NAME_KEYS", () => {
  it("includes Traore under the normalized key used for search exclusion", () => {
    assert.equal(normalizePersonName("Traoré"), "traore");
    assert.ok(NETS_SEED_NAME_KEYS.has("nolan|traore"));
  });
});
