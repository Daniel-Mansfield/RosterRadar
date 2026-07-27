# Spike: Official NBA.com stats vs BALLDONTLIE

**Status:** Ready to run (Phase 1 merged `f3fddb4`)  
**Goal:** Decide with evidence whether RosterRadar should add an `nba_com` adapter or stay on BALLDONTLIE (paid tier if needed).  
**Time box:** 2–4 hours hard stop. Do not start Phase 2 scoring until this spike records a PASS or FAIL.

Related: [`BACKEND.md`](./BACKEND.md) · [`PHASE_1_REVIEW.md`](./PHASE_1_REVIEW.md)

---

## Why this spike

BALLDONTLIE free cannot supply active roster / game stats / season averages needed for a real dossier. Official NBA.com stats can — but often fail from cloud (Vercel) due to bot protection. We will not rewrite the product on optimism.

Architecture already supports a swap: keep `NbaStatsPort`; only the adapter changes.

---

## Decision rule (write this down before coding)

| Result | Action |
|---|---|
| **PASS** | Implement `src/nba/nbaCom/` adapter; keep BALLDONTLIE + seed as fallback; `NBA_DATA_PROVIDER` env switch |
| **FAIL** | Stop NBA.com work; start BALLDONTLIE **GOAT 48h trial** (or ALL-STAR if game-log aggregation is enough); keep seed fallback |
| **PARTIAL** | Local works, Vercel fails → treat as **FAIL for primary vendor** unless we accept a non-serverless proxy (out of scope for 10-day MVP) |

**PASS requires all three proofs below.** Missing the deploy proof = not PASS.

---

## Proofs

### Proof A — Local: Nets roster (or equivalent)
- Call an NBA.com team roster endpoint for Brooklyn (team id typically `1610612751`).
- Normalize to our domain shape mentally: names + positions enough to replace/augment seed.
- **Pass if:** HTTP 200, parseable players, looks like a current-ish NBA roster (not empty / not HTML block page).

Suggested starting points (unofficial; names drift):
- `commonteamroster` (stats.nba.com) for current season
- Confirm season string format the endpoint expects (e.g. `2025-26`)

### Proof B — Local: one player season + recent games
Pick one known player (e.g. resolved BDL id mapped later; for spike use NBA person id from roster).
- Season averages **or** league dash row for that player/season
- Player game log — enough rows to derive last ~10 games
- **Pass if:** both return numeric stats we could feed into pillars / L10 vs season later

### Proof C — Deployed: same calls from Vercel
- Minimal Route Handler or script invoked via a preview deployment (even a throwaway `GET /api/spike/nba-com`).
- **Pass if:** Proof A and B succeed from the deployed environment within the time box (not only `localhost`).

If Proof C hangs, 403s, or returns Akamai/challenge HTML → **FAIL**.

---

## Out of scope (do not do in this spike)

- Full `NbaStatsPort` implementation / PR of production adapter
- Deleting BALLDONTLIE or the seed
- Scoring formulas or dossier UI
- Proxies, residential IPs, Puppeteer, TLS impersonation “to make Vercel work”
- Multi-day vendor shopping

---

## How to run (suggested order)

1. Branch from `main`: `spike/nba-com-vendor` (this branch).
2. Local Node `fetch` script under `scripts/spike-nba-com.mjs` (no secrets required for NBA.com).
3. Record raw outcomes in **Results** below (status codes, 3–5 sample names, whether body looks like JSON).
4. If A+B pass, add the smallest possible spike route and deploy a Vercel preview — or run Proof C against an existing project deploy.
5. Fill **Decision**, commit this doc, merge the docs PR (or spike branch), then proceed.

---

## Results log

| Proof | Ran? | HTTP / outcome | Notes |
|---|---|---|---|
| A — Roster (local) | ☐ | | |
| B — Season + game log (local) | ☐ | | |
| C — Same on Vercel | ☐ | | |

**Date:**  
**Operator:**  
**Decision:** ☐ PASS · ☐ FAIL · ☐ PARTIAL→FAIL  

**Follow-up committed to:**
- ☐ `nba_com` adapter next  
- ☐ BALLDONTLIE GOAT trial / ALL-STAR upgrade next  

---

## If PASS — next implementation slice

1. `src/nba/nbaCom/` with Zod at boundary  
2. `NBA_DATA_PROVIDER=nba_com|balldontlie`  
3. `getNetsRoster` from NBA.com; keep seed fallback on error  
4. Extend port for season + recent games when Phase 2 starts  
5. Disclose unofficial NBA.com use in write-up / `AI_USAGE.md`

## If FAIL — next implementation slice

1. Start BALLDONTLIE GOAT 48h trial  
2. Confirm `/players/active`, `/stats`, season averages access with our key  
3. Extend BALLDONTLIE adapter; shrink reliance on seed where live data works  
4. Do **not** keep poking NBA.com in parallel during Phase 2
