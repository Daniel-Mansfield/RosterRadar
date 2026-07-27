import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseMinutes } from "@/nba/parseMinutes";

describe("parseMinutes", () => {
  it("parses clock strings", () => {
    assert.ok(Math.abs(parseMinutes("32:30") - 32.5) < 0.001);
  });

  it("treats 00 as zero", () => {
    assert.equal(parseMinutes("00"), 0);
  });
});
