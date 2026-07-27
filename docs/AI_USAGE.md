# AI usage disclosure

RosterRadar’s **concept, scoring model, and product decisions are original** (role-fit scouting dossier for NBA decision-makers). AI tools assist with planning, documentation, and implementation; they do not own the central idea.

This log supports the assignment requirement to disclose AI use. Append entries as work continues.

## Tools
| Tool | Role |
|---|---|
| Cursor (Composer / agent) | Planning, docs, rules, coding assistance |
| Other LLMs (if used) | Note model + purpose in an entry below |

## Policy
- Disclose prompts/assistance relevant to submitted work in the final write-up (summarize from this log).
- Do not paste secrets or API keys into AI chats.
- Prefer AI for scaffolding, refactors, and explanation; keep scoring formulas and product judgment human-owned and documented.
- Review all AI-generated code against project rules (root-cause-first, TS/React, backend, UI/UX).

## Log

### 2026-07-26 — Project planning & foundation
- **Tool:** Cursor agent
- **Used for:** Product brainstorm → RosterRadar naming; scouting-dossier MVP; project outline; design system; backend ports/adapters philosophy; Cursor rules (product, TS/React, UI/UX, backend, root-cause); Phase 0 docs
- **Not used for:** Final scoring weights/thresholds (still to be designed by us); proprietary CTG/BBall Index formulas (inspiration only)
- **Prompts / topics (summary):** NBA “Leetify-like” app for FO; role-fit dossier UX; name bank; assignment-fit critique; reputable sources for UX/backend; Phase 0 setup

### 2026-07-26 — Phase 1 scaffold
- **Tool:** Cursor agent
- **Used for:** Next.js + TypeScript scaffold, design tokens, Zod BALLDONTLIE adapter, `/api/players` spike, Nets home (court/bench/drawer), curated roster seed (free-tier active-roster gap), identity/palette lock
- **Not used for:** Fit scoring / full dossier content (placeholder drawer only)

### 2026-07-26 — Identity lock (Nets court + dossier drawer)
- **Tool:** Cursor agent
- **Used for:** Drawing board → Nets-only home, non-Nets acquisition search, brand palette wiring, outline updates
- **Not used for:** DnD trade simulation (explicitly cut from v1)

### 2026-07-26 — Phase 1 self-review remediations
- **Tool:** Cursor agent
- **Used for:** Pre-merge code review; domain/error split; Zod client boundaries; search debounce; drawer a11y; muted contrast; seed id resolution (partial); `docs/PHASE_1_REVIEW.md`
- **Not used for:** Scoring formulas; inventing unresolved BDL ids

### 2026-07-27 — Phase 1 Pass 2 pre-merge re-review
- **Tool:** Cursor agent
- **Used for:** Second full code review against identity/MVP expectations; live BDL probe of excludeNets; updated `docs/PHASE_1_REVIEW.md` with open gate items (R14–R22)
- **Not used for:** Applying remediations yet (awaiting go-ahead); scoring / Phase 2 implementation

### 2026-07-27 — Phase 1 merged; NBA.com vendor spike planned
- **Tool:** Cursor agent
- **Used for:** Confirmed PR #1 merge on `main`; authored `docs/SPIKE_NBA_COM.md` pass/fail gate before Phase 2 scoring
- **Not used for:** Running the spike yet; scoring implementation

### 2026-07-27 — NBA.com spike Proof A+B executed
- **Tool:** Cursor agent
- **Used for:** `scripts/spike-nba-com.mjs`, temporary `/api/spike/nba-com`; local roster + career/game-log proofs (both PASS); documented results pending Vercel Proof C
- **Not used for:** Final vendor lock; production `nba_com` adapter

### 2026-07-27 — NBA.com capacity spike expanded (A/B/D/E)
- **Tool:** Cursor agent
- **Used for:** Extended spike for search (`commonallplayers`) + peer percentiles (`leaguedashplayerstats`); fixed diacritic search false negative; expanded `/api/spike/nba-com` capacity payload
- **Not used for:** Vercel Proof C (awaiting account login); production adapter

### 2026-07-27 — NBA.com Proof C FAIL; vendor decision locked
- **Tool:** Cursor agent
- **Used for:** Made repo public; Vercel preview deploy; disabled SSO protection; Proof C returned `fetch failed` from stats.nba.com on Vercel; recorded FAIL → BALLDONTLIE paid path
- **Not used for:** Building nba_com production adapter; starting GOAT trial (human account step)

### 2026-07-27 — Vendor decision doc + repo cleanup prep
- **Tool:** Cursor agent
- **Used for:** Authored `docs/VENDOR_DECISION.md` (absorbs spike findings); removing spike artifacts and scaffold clutter on `spike/nba-com-vendor` (PR, not merge-yet)
- **Not used for:** GOAT endpoint verification; Phase 2 scoring

### 2026-07-27 — Docs hygiene before Phase 2
- **Tool:** Cursor agent
- **Used for:** Synced PHASE_1_REVIEW Pass 3, BACKEND MVP, PROJECT_OUTLINE, DEVELOPMENT with `VENDOR_DECISION.md` (no new doc files)
- **Not used for:** GOAT verify; Phase 2 implementation

### 2026-07-27 — Phase 2 kickoff: GOAT verify PASS
- **Tool:** Cursor agent
- **Used for:** `scripts/verify-goat.mjs`; confirmed active players + season averages + game stats on GOAT trial (paced for 5 req/min)
- **Not used for:** Finished scoring formulas (next on branch)

### 2026-07-27 — Phase 2 dossier vertical slice
- **Tool:** Cursor agent
- **Used for:** GOAT verify; `scoring/` compose + tests; season/game adapter methods; `/api/dossier/[id]`; drawer `DossierPanel`; R14 aliases + R15 client Zod error; seed ids for Ziaire/Ochai
- **Not used for:** Final write-up; post-trial fixtures plan

---

*Add new dated entries below as AI is used in later phases.*
