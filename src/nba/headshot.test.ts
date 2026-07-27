import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { espnNbaHeadshotUrl, playerInitials } from "@/nba/headshot";

describe("playerInitials", () => {
  it("uses first letters of first and last name", () => {
    assert.equal(playerInitials("Michael", "Porter Jr."), "MP");
    assert.equal(playerInitials("Nic", "Claxton"), "NC");
  });
});

describe("espnNbaHeadshotUrl", () => {
  it("builds the ESPN full headshot path", () => {
    assert.equal(
      espnNbaHeadshotUrl(4432174),
      "https://a.espncdn.com/i/headshots/nba/players/full/4432174.png",
    );
  });

  it("rejects non-positive ids", () => {
    assert.throws(() => espnNbaHeadshotUrl(0));
    assert.throws(() => espnNbaHeadshotUrl(-1));
  });
});
