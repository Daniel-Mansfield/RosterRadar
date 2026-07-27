# Spike: Official NBA.com stats vs BALLDONTLIE

**Status:** **COMPLETE — FAIL for NBA.com as primary vendor** (local PASS, Vercel Proof C FAIL)  
**Goal:** Decide with evidence whether RosterRadar should add an `nba_com` adapter or stay on BALLDONTLIE (paid tier if needed).  
**Time box:** 2–4 hours hard stop.

Related: [`BACKEND.md`](./BACKEND.md) · [`PHASE_1_REVIEW.md`](./PHASE_1_REVIEW.md)

---

## Decision (locked 2026-07-27)

| Result | Choice |
|---|---|
| **PARTIAL → FAIL** | Local capacities excellent; **stats.nba.com fails from Vercel** (`fetch failed` after ~71s on `/api/spike/nba-com`) |

**Follow-up committed to:** BALLDONTLIE **GOAT 48h trial** (or ALL-STAR if game-log aggregation is enough). Keep curated seed as fallback. Do **not** build `nba_com` as the production adapter for the 10-day MVP.

Live preview used for Proof C: `https://roster-radar-n6tjboaop-daniel-mansfield1.vercel.app`  
Production alias: `https://roster-radar-orcin.vercel.app`  
Repo visibility: **public** (required for Hobby + Cursor co-authored commits).

---

## Why this spike

BALLDONTLIE free cannot supply active roster / game stats / season averages needed for a real dossier. Official NBA.com stats can locally — but cloud/bot protection often blocks serverless hosts. Evidence over optimism.

---

## Capacities tested

| Product need | Endpoint(s) | Proof | Local | Vercel |
|---|---|---|---|---|
| Current Nets roster | `commonteamroster` | A / C | **PASS** (18) | **FAIL** (`fetch failed`) |
| Season averages | `playercareerstats` | B | **PASS** | (same host — blocked) |
| L10 / recent form | `playergamelog` | B | **PASS** | (same host — blocked) |
| Acquisition search | `commonallplayers` | D | **PASS** (582; diacritic normalize) | (same host — blocked) |
| Peer percentiles | `leaguedashplayerstats` | E | **PASS** (582) | **FAIL** in spike route |

---

## How we ran Proof C

1. Made GitHub repo **public** (Hobby blocked private-repo deploys with non-owner commit attribution).
2. Deployed branch: `npx vercel --yes` → Ready.
3. Disabled SSO deployment protection so the URL is publicly reachable.
4. `npx vercel curl /api/spike/nba-com --deployment <preview>` → `{"proof":"C","ok":false,"error":"fetch failed"}`.

---

## Results log

| Proof | Outcome | Notes |
|---|---|---|
| A — Roster (local) | **PASS** | 2025-26 Nets, 18 players |
| B — Season + game log (local) | **PASS** | Career + 49 games |
| D — Player search (local) | **PASS** | Diacritics matter (`doncic` → Dončić) |
| E — League dash (local) | **PASS** | Pillar fields present |
| C — Vercel | **FAIL** | Deploy OK; NBA.com outbound `fetch failed` |

**Date:** 2026-07-27  
**Operator:** Cursor agent + Daniel  
**Decision:** ☑ PARTIAL→FAIL  

---

## Next implementation slice (BALLDONTLIE path)

1. Start BALLDONTLIE **GOAT** 48h trial (payment method required; cancel if not keeping).  
2. Confirm with our key: `/players/active`, game stats, season averages.  
3. Extend `balldontlie` adapter; shrink seed where live data works.  
4. Remove temporary `src/app/api/spike/nba-com` after Phase 2 wiring (or keep disabled).  
5. Do not dual-live NBA.com as primary during scoring work.

## Optional later

If we ever need NBA.com depth offline: document as local-only research tool — not the Vercel runtime source of truth.
