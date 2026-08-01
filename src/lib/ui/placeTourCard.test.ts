import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { placeTourCard } from "@/lib/ui/placeTourCard";

const card = { width: 320, height: 180 };
const viewport = { width: 1280, height: 800 };

describe("placeTourCard", () => {
  it("keeps a small top target’s card fully on-screen without overlap", () => {
    const target = { top: 40, left: 400, width: 280, height: 48 };
    const pos = placeTourCard(target, card, viewport);
    assert.ok(pos.top >= 16);
    assert.ok(pos.left >= 16);
    assert.ok(pos.top + card.height <= viewport.height - 16);
    assert.ok(pos.left + card.width <= viewport.width - 16);
    // Beside or below — not covering the search field.
    const overlapsTarget =
      pos.left < target.left + target.width &&
      pos.left + card.width > target.left &&
      pos.top < target.top + target.height &&
      pos.top + card.height > target.top;
    assert.equal(overlapsTarget, false);
  });

  it("keeps the card fully on-screen for a tall full-height target", () => {
    const pos = placeTourCard(
      { top: 80, left: 900, width: 280, height: 700 },
      card,
      viewport,
    );
    assert.ok(pos.top >= 16);
    assert.ok(pos.left >= 16);
    assert.ok(pos.top + card.height <= viewport.height - 16);
    assert.ok(pos.left + card.width <= viewport.width - 16);
  });

  it("places a left-rail target’s card to the right without overlapping", () => {
    const target = { top: 100, left: 16, width: 260, height: 640 };
    const pos = placeTourCard(target, card, viewport);
    assert.ok(pos.left >= target.left + target.width);
    assert.ok(pos.top + card.height <= viewport.height - 16);
  });

  it("clamps a near-edge target so the card never clips", () => {
    const pos = placeTourCard(
      { top: 750, left: 1100, width: 160, height: 40 },
      card,
      viewport,
    );
    assert.ok(pos.top >= 16);
    assert.ok(pos.left >= 16);
    assert.ok(pos.top + card.height <= viewport.height - 16);
    assert.ok(pos.left + card.width <= viewport.width - 16);
  });
});
