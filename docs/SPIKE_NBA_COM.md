# Spike: Official NBA.com stats vs BALLDONTLIE

**Status:** Local capacities **PASS** (A/B/D/E). Proof C (Vercel) **not run** — decision still gated.  
**Goal:** Decide with evidence whether RosterRadar should add an `nba_com` adapter or stay on BALLDONTLIE (paid tier if needed).  
**Time box:** 2–4 hours hard stop. Do not start Phase 2 scoring until this spike records a PASS or FAIL.

Related: [`BACKEND.md`](./BACKEND.md) · [`PHASE_1_REVIEW.md`](./PHASE_1_REVIEW.md)

---

## Why this spike

BALLDONTLIE free cannot supply active roster / game stats / season averages needed for a real dossier. Official NBA.com stats can — but often fail from cloud (Vercel) due to bot protection. We will not rewrite the product on optimism.

Architecture already supports a swap: keep `NbaStatsPort`; only the adapter changes.

---

## Decision rule

| Result | Action |
|---|---|
| **PASS** | Implement `src/nba/nbaCom/` adapter; keep BALLDONTLIE + seed as fallback; `NBA_DATA_PROVIDER` env switch |
| **FAIL** | Stop NBA.com work; start BALLDONTLIE **GOAT 48h trial** (or ALL-STAR); keep seed fallback |
| **PARTIAL** | Local works, Vercel fails → **FAIL for primary vendor** (no proxy workarounds in 10-day MVP) |

**Full PASS requires Proof C.** Local capacity proofs alone are not enough to lock the vendor.

---

## Capacities we need (mapped to proofs)

| Product need | Endpoint(s) | Proof |
|---|---|---|
| Current Nets roster | `commonteamroster` | A |
| Season averages | `playercareerstats` | B |
| L10 / recent form | `playergamelog` | B |
| Acquisition search | `commonallplayers` + local name filter | D |
| Peer percentiles | `leaguedashplayerstats` | E |
| Same calls from live host | `GET /api/spike/nba-com` on Vercel | C |

---

## How to run

```bash
# Local capacity suite (A, B, D, E)
npm run spike:nba-com

# Spike route smoke (still local — not Proof C)
npm run build && npm run start
curl -s localhost:3000/api/spike/nba-com

# Proof C — requires Vercel login + preview deploy of this branch
npx vercel login
npx vercel          # link project / deploy preview
curl -s https://<preview>.vercel.app/api/spike/nba-com
```

Artifacts:
- `scripts/spike-nba-com.mjs`
- `src/app/api/spike/nba-com/route.ts` (temporary)

---

## Results log

| Proof | Ran? | Outcome | Notes |
|---|---|---|---|
| A — Roster | ✅ | **PASS** | `2025-26` Nets roster, **18** players (Minott, Ziaire, Wolf, Powell, Dëmin, …) — clearly more current than seed |
| B — Season + game log | ✅ | **PASS** | Career season row + **49** game logs for Minott — L10-ready |
| D — Player search | ✅ | **PASS** | `commonallplayers` = **582** players; name filter finds Tatum / Dončić / Curry. **Adapter must normalize diacritics** (`doncic` → Dončić) |
| E — League dash / percentiles | ✅ | **PASS** | **582** league rows; pillar fields present: PTS, AST, REB, STL, BLK, FG3M, FG3_PCT, FT_PCT, TOV, PLUS_MINUS |
| C — Vercel | ☐ | **NOT RUN** | CLI not authenticated yet. Spike route expanded to report roster + leagueDash + playerDirectory |

**Date:** 2026-07-27  
**Operator:** Cursor agent + Daniel  
**Decision:** ☐ PASS · ☐ FAIL · ☐ PARTIAL→FAIL — **blocked on Proof C only**

**Local summary:** `localCapacitiesReady: true`

**Follow-up:**
- ☐ Authenticate Vercel (`npx vercel login`) → deploy this branch → hit `/api/spike/nba-com`
- ☐ If C passes → `nba_com` adapter
- ☐ If C fails → BALLDONTLIE GOAT trial / ALL-STAR

---

## Adapter notes (if we proceed)

1. Use **NBA person ids** (not BALLDONTLIE ids) when `nba_com` is primary — or maintain a mapping table.
2. Name search: NFD diacritic strip before substring match.
3. Exclude Nets via `TEAM_ID === 1610612751` / abbreviation `BKN` from directory rows.
4. Keep seed fallback if roster fetch fails at runtime.
5. Disclose unofficial NBA.com use in write-up / `AI_USAGE.md`.

---

## If FAIL after Proof C

1. Start BALLDONTLIE GOAT 48h trial  
2. Confirm active players + stats + season averages  
3. Extend BALLDONTLIE adapter; do not keep dual-primary vendors during Phase 2
