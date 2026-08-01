import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  planPlayerSearch,
  playerMatchesSearchPlan,
} from "@/nba/playerSearchQuery";

describe("planPlayerSearch", () => {
  it("passes a single token through with no local filters", () => {
    assert.deepEqual(planPlayerSearch("LeBron"), {
      vendorSearch: "LeBron",
      firstNamePrefix: null,
      lastNamePrefix: null,
    });
    assert.deepEqual(planPlayerSearch("James"), {
      vendorSearch: "James",
      firstNamePrefix: null,
      lastNamePrefix: null,
    });
  });

  it("uses the last token when it is at least two letters", () => {
    assert.deepEqual(planPlayerSearch("LeBron Ja"), {
      vendorSearch: "Ja",
      firstNamePrefix: "lebron",
      lastNamePrefix: "ja",
    });
    assert.deepEqual(planPlayerSearch("LeBron James"), {
      vendorSearch: "James",
      firstNamePrefix: "lebron",
      lastNamePrefix: "james",
    });
  });

  it("searches the first given-name token when only a last initial is typed", () => {
    assert.deepEqual(planPlayerSearch("LeBron J"), {
      vendorSearch: "LeBron",
      firstNamePrefix: "lebron",
      lastNamePrefix: "j",
    });
  });

  it("keeps a single-token vendorSearch for multi-word given names + last initial", () => {
    // e.g. typing toward Karl-Anthony Towns as "Karl Anthony T"
    assert.deepEqual(planPlayerSearch("Karl Anthony T"), {
      vendorSearch: "Karl",
      firstNamePrefix: "karlanthony",
      lastNamePrefix: "t",
    });
  });

  it("uses the surname token for a two-word full name", () => {
    assert.deepEqual(planPlayerSearch("Luca Doncic"), {
      vendorSearch: "Doncic",
      firstNamePrefix: "luca",
      lastNamePrefix: "doncic",
    });
  });
});

describe("playerMatchesSearchPlan", () => {
  const lebron = { firstName: "LeBron", lastName: "James" };

  it("keeps LeBron for first-name search + last initial", () => {
    const plan = planPlayerSearch("LeBron J");
    assert.equal(playerMatchesSearchPlan(lebron, plan), true);
    assert.equal(
      playerMatchesSearchPlan({ firstName: "LeBron", lastName: "Smith" }, plan),
      false,
    );
  });

  it("keeps LeBron for surname search + first-name prefix", () => {
    const plan = planPlayerSearch("LeBron James");
    assert.equal(playerMatchesSearchPlan(lebron, plan), true);
    assert.equal(
      playerMatchesSearchPlan({ firstName: "Bronny", lastName: "James" }, plan),
      false,
    );
  });

  it("matches hyphenated given names when typed as separate tokens + last initial", () => {
    const plan = planPlayerSearch("Karl Anthony T");
    assert.equal(
      playerMatchesSearchPlan(
        { firstName: "Karl-Anthony", lastName: "Towns" },
        plan,
      ),
      true,
    );
    assert.equal(
      playerMatchesSearchPlan(
        { firstName: "Karl", lastName: "Towns" },
        plan,
      ),
      false,
    );
  });

  it("does not filter single-token plans locally", () => {
    const plan = planPlayerSearch("James");
    assert.equal(playerMatchesSearchPlan(lebron, plan), true);
    assert.equal(
      playerMatchesSearchPlan({ firstName: "James", lastName: "Harden" }, plan),
      true,
    );
  });
});
