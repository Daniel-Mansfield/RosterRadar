# Vendor & hosting decision record

**Purpose:** Preserve the research and tradeoffs behind RosterRadar’s data vendor and live-URL approach so the assignment write-up and future work don’t lose context.  
**Audience:** Graders / write-up readers **and** future maintainers.  
**Status:** Locked **2026-07-27** (post–Phase 1).  
**Related:** [`BACKEND.md`](./BACKEND.md) · [`DEVELOPMENT.md`](./DEVELOPMENT.md) · [`PHASE_1_REVIEW.md`](./PHASE_1_REVIEW.md)

---

## 1. Decision (locked)

| Choice | Detail |
|---|---|
| **Primary NBA data vendor** | [BALLDONTLIE](https://docs.balldontlie.io/) behind `NbaStatsPort` |
| **Tier for Phase 2 build** | **GOAT trial** (then decide paid month vs fixtures before trial ends) |
| **Post-trial path (decided 2026-07-28)** | **One paid month of GOAT ($39.99)** covering the demo window; caching + `rate_limited` handling as safety net; fixtures remain the documented fallback. Season averages are GOAT-only, so ALL-STAR was never sufficient. BDL has no headshot data at any tier — headshots stay ESPN-CDN-based |
| **Roster fallback** | Curated seed (`src/nba/nets/rosterSeed.ts`) when live roster is unavailable or fails |
| **Official NBA.com (`stats.nba.com`)** | **Not** the production adapter on Vercel — excellent locally, blocked from cloud |
| **Public host** | Vercel (Next.js). Repo is **public** (Hobby + private repo blocked some deploys) |

**One-line rationale:** We need cloud-callable roster/stats for a live demo. NBA.com has richer free data on a laptop but fails from Vercel; BALLDONTLIE GOAT is cloud-friendly and unblocks Phase 2 without proxy complexity.

---

## 2. What we needed from a vendor

| Product need | Why it matters |
|---|---|
| Current-ish Nets roster | Home court / bench (IDENTITY) |
| Player search (non-Nets) | Acquisition candidates |
| Season averages | Role pillars / percentiles |
| Recent games (≈ L10) | Evidence strip |
| League-wide peer set | Percentiles vs peers |
| Works from a **public URL** | Assignment live deploy |

---

## 3. Options we evaluated

### A. BALLDONTLIE (free)
- **Pros:** Documented REST, API key, works on Vercel, already wired for search.
- **Cons:** Free tier lacks active roster, game player stats, season averages (401 / gated). Forced curated seed for Nets home.
- **Verdict:** Fine for Phase 1 shell; **not enough alone** for an honest dossier.

### B. BALLDONTLIE (ALL-STAR ~$10/mo or GOAT ~$40/mo / 48h GOAT trial)
- **Pros:** Cloud-friendly; ALL-STAR unlocks active players + game stats; GOAT adds season averages and more.
- **Cons:** Not free forever; trial ends → need paid month or fixture fallback.
- **Verdict:** **Chosen path for Phase 2 build** via GOAT trial; plan for post-trial before it expires.

### C. Official NBA.com stats (`stats.nba.com`)
- **Pros (local):** Current Nets roster, career/season rows, game logs, full player directory, league dash for percentiles — clearly richer than free BALLDONTLIE.
- **Cons (cloud):** From Vercel, outbound `fetch` to `stats.nba.com` failed (`fetch failed` ~71s). Typical Akamai / datacenter IP block — **not fixed by Vercel Pro**.
- **Mitigations considered:** Other PaaS hosts (same IP class, low odds); residential proxy (costs money); home-host / tunnel (free but fragile); fixtures refreshed locally from NBA.com (free + stable demo).
- **Verdict:** Valuable as a **local research** source; **rejected as Vercel runtime primary** for this MVP.

### D. Fixtures-only (free forever)
- Snapshot season/L10/peers into the repo; free search + seed for live bits.
- **Pros:** No trial cliff; reproducible for graders.
- **Cons:** Stats dated until refreshed.
- **Verdict:** Strong **backup** if GOAT trial is not extended; not the first build path while trial is active.

### E. Hosting alternatives (if prioritizing NBA.com live + free)
- Home-hosted Node / tunnel during demo window.
- **Verdict:** Valid if “live NBA.com” outranks always-on Vercel; we preferred cloud demo + BALLDONTLIE GOAT for the assignment shape.

---

## 4. Spike evidence (NBA.com)

Time-boxed proofs on branch `spike/nba-com-vendor` (artifacts since removed; results kept here).

| Proof | Need | Local | Vercel |
|---|---|---|---|
| A | Nets roster (`commonteamroster`) | **PASS** (18 players, 2025–26) | **FAIL** |
| B | Season + game log | **PASS** | (same host — blocked) |
| D | Player directory / search | **PASS** (582; diacritic-normalize names e.g. Dončić) | (blocked) |
| E | League dash / percentiles | **PASS** (582 rows; PTS/AST/REB/…) | **FAIL** |
| C | Same calls from deployed app | — | **FAIL** (`{"ok":false,"error":"fetch failed"}`) |

**Deploy notes:** GitHub repo made **public** after Hobby blocked private-repo deploys with non-owner commit attribution. SSO deployment protection disabled so the preview URL was publicly reachable. Failure was **NBA.com egress**, not “Next failed to build.”

Preview used for Proof C: `roster-radar-*.vercel.app` under project `roster-radar`.

---

## 5. Why we did not “just fix Vercel + NBA.com”

| Idea | Why it wasn’t the MVP path |
|---|---|
| Upgrade Vercel | Doesn’t change datacenter vs Akamai |
| Extra headers / retries | Insufficient against IP blocks |
| Residential proxy | Costs money; ToS/ops noise for 10 days |
| Switch to Railway/Fly only | Same cloud IP class; unproven |
| Keep spike route in prod | Research debris; decision is recorded here instead |

---

## 6. Locked operating model (going forward)

1. **Extend** `src/nba/balldontlie/` for GOAT-tier endpoints (active roster / stats / season averages as needed).  
2. **Keep** seed as fallback and for demo resilience.  
3. **Do not** ship a production `nba_com` adapter on Vercel for v1.  
4. **Before GOAT trial ends:** either keep a paid tier **or** snapshot fixtures so the live demo doesn’t cliff.  
5. **Disclose** vendor limits and AI use in the write-up ([`AI_USAGE.md`](./AI_USAGE.md)).

### GOAT verify (2026-07-27)
`npm run verify:goat` against rotated key:

| Check | Result |
|---|---|
| `/nba/v1/players` search | PASS |
| `/nba/v1/players/active` | PASS |
| `/nba/v1/season_averages/general` (2025) | PASS |
| `/nba/v1/stats` game logs (2025) | PASS |

Note: trial rate limit ≈ **5 req/min** — adapter/dossier composition must pace or batch; burst calls return 429.

---

## 7. Known debt carried from Phase 1 (not fixed in cleanup)

See also [`PHASE_1_REVIEW.md`](./PHASE_1_REVIEW.md) Pass 2:

| ID | Issue | Disposition |
|---|---|---|
| R14 | Acquisition filter misses nickname aliases (e.g. Nic vs Nicolas Claxton) | Fix when extending search/roster on GOAT |
| R15 | Client Zod parse failure shown as empty results | Fix with search/dossier client hardening |
| R18 | Some seed BDL ids still null | Resolve against GOAT/active players when wiring dossier |
| Trial cliff | GOAT access temporary | Plan paid month or fixtures before expiry |

---

## 8. Chronology (short)

| When | What |
|---|---|
| Phase 1 | BALLDONTLIE free + curated Nets seed; search works on Vercel path |
| 2026-07-27 | Evaluated NBA.com vs paid BALLDONTLIE vs fixtures vs hosting tradeoffs |
| 2026-07-27 | NBA.com local capacities PASS; Vercel Proof C FAIL |
| 2026-07-27 | Locked BALLDONTLIE GOAT trial path; documented here; spike code removed |
| 2026-07-28 | Post-trial decision: one paid GOAT month for demo window (600 req/min removes trial pacing); fixtures stay as fallback plan |

---

*Amend this file if the vendor or hosting model changes; don’t leave decisions only in chat history.*
