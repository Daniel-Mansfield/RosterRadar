import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { selectEspnAthleteIdFromSearch } from "@/nba/espn/resolveEspnAthleteId";

const lebronFixture = {
  results: [
    {
      type: "player",
      contents: [
        {
          displayName: "LeBron James",
          description: "NBA",
          subtitle: "Philadelphia 76ers",
          uid: "s:40~l:46~a:1966",
          link: {
            web: "https://www.espn.com/nba/player/_/id/1966/lebron-james",
          },
          image: {
            default:
              "https://a.espncdn.com/i/headshots/nba/players/full/1966.png",
          },
        },
        {
          displayName: "Xavi Simons",
          description: "FIFA World Cup",
          subtitle: "Netherlands",
          uid: "s:1~l:1~a:999",
          link: { web: "https://www.espn.com/soccer/player/_/id/999/xavi" },
        },
      ],
    },
  ],
};

describe("selectEspnAthleteIdFromSearch", () => {
  it("picks the NBA player id from a search payload", () => {
    assert.equal(
      selectEspnAthleteIdFromSearch(lebronFixture, {
        firstName: "LeBron",
        lastName: "James",
        teamAbbreviation: null,
      }),
      1966,
    );
  });

  it("prefers a team-matching hit when available", () => {
    const fixture = {
      results: [
        {
          type: "player",
          contents: [
            {
              displayName: "Anfernee Simons",
              description: "NBA",
              subtitle: "Philadelphia 76ers",
              link: {
                web: "https://www.espn.com/nba/player/_/id/4351851/anfernee-simons",
              },
            },
          ],
        },
      ],
    };
    assert.equal(
      selectEspnAthleteIdFromSearch(fixture, {
        firstName: "Anfernee",
        lastName: "Simons",
        teamAbbreviation: "PHI",
      }),
      4351851,
    );
  });

  it("returns null when no NBA name match exists", () => {
    assert.equal(
      selectEspnAthleteIdFromSearch(lebronFixture, {
        firstName: "Zznotaplayer",
        lastName: "Qqxyz",
        teamAbbreviation: "LAL",
      }),
      null,
    );
  });
});
