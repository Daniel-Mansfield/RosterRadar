# Spike: Official NBA.com stats vs BALLDONTLIE

**Status:** In progress — Proof A + B **PASS** locally; Proof C (Vercel) **not run**  
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
- Minimal Route Handler: `GET /api/spike/nba-com`
- **Pass if:** roster fetch succeeds from the **deployed** environment (not only `localhost` / `next start` on a laptop).

If Proof C hangs, 403s, or returns Akamai/challenge HTML → **FAIL**.

---

## Out of scope (do not do in this spike)

- Full `NbaStatsPort` implementation / PR of production adapter
- Deleting BALLDONTLIE or the seed
- Scoring formulas or dossier UI
- Proxies, residential IPs, Puppeteer, TLS impersonation “to make Vercel work”
- Multi-day vendor shopping

---

## How to run

```bash
# Proof A + B (local)
npm run spike:nba-com

# Spike route (local smoke — not Proof C)
npm run build && npm run start
# then: curl -s localhost:3000/api/spike/nba-com

# Proof C — after Vercel project is linked:
# Deploy this branch / preview, then:
# curl -s https://<preview>.vercel.app/api/spike/nba-com
```

Artifacts:
- `scripts/spike-nba-com.mjs`
- `src/app/api/spike/nba-com/route.ts` (temporary; remove after decision)

---

## Results log

| Proof | Ran? | HTTP / outcome | Notes |
|---|---|---|---|
| A — Roster (local) | ✅ | **200 / PASS** | `commonteamroster` season `2025-26`, **18** players. Sample: Josh Minott, Ziaire Williams, Danny Wolf, Drake Powell, Egor Dëmin, Terance Mann… Looks far more current than our curated seed. |
| B — Season + game log (local) | ✅ | **200 / PASS** | `playercareerstats` + `playergamelog` for Minott (`1631169`). Season row + **49** games in 2025-26 log (L10-capable). |
| C — Same on Vercel | ☐ | **NOT RUN** | Spike route works on local `next start` (`ok:true`, 18 players). **Vercel preview still required** for the real gate. |

**Date:** 2026-07-27  
**Operator:** Cursor agent + Daniel  
**Decision:** ☐ PASS · ☐ FAIL · ☐ PARTIAL→FAIL — **blocked on Proof C**

**Local smoke (not Proof C):** `GET /api/spike/nba-com` via `next start` → `ok: true`, `playerCount: 18`.

**Follow-up committed to:**
- ☐ `nba_com` adapter next (only if Proof C passes)
- ☐ BALLDONTLIE GOAT trial / ALL-STAR upgrade next (if Proof C fails)
- ☐ Finish hello-world Vercel deploy, then re-hit `/api/spike/nba-com`

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
