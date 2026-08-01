# AI usage disclosure

RosterRadar’s **concept, scoring model, and product decisions are original** (role-fit scouting dossier for NBA decision-makers). AI tools assist with planning, documentation, and implementation; they do not own the central idea.

This log supports the assignment requirement to disclose AI use. Keep entries summary-style; append when a phase or major feature uses AI.

## Tools
| Tool | Role |
|---|---|
| Cursor (Composer / agent) | Planning, docs, rules, coding assistance |
| Other LLMs (if used) | Note model + purpose in an entry below |

## Policy
- Disclose assistance relevant to submitted work in the final write-up (summarize from this log).
- Do not paste secrets or API keys into AI chats.
- Prefer AI for scaffolding, refactors, and explanation; keep scoring formulas and product judgment human-owned and documented.
- Review all AI-generated code against project rules (root-cause-first, TS/React, backend, UI/UX).

## Log

### 2026-07-26 — Phase 0–1 foundation
- **Tool:** Cursor agent
- **Used for:** Product framing → RosterRadar; outline / design system / backend / Cursor rules; Next.js scaffold; Nets home + search + drawer placeholder; Phase 1 self-review remediations
- **Not used for:** Final scoring weights; inventing unresolved BDL ids

### 2026-07-27 — Vendor lock + Phase 2 dossier
- **Tool:** Cursor agent
- **Used for:** NBA.com Vercel spike (FAIL) → BALLDONTLIE GOAT path ([`VENDOR_DECISION.md`](./VENDOR_DECISION.md)); `scoring/` + dossier API/UI; cache; UI polish; headshots; CI
- **Not used for:** Proprietary CTG-style formulas; Redis / shared cache

### 2026-07-28 — Phase 3 harden + On the Radar
- **Tool:** Cursor agent
- **Used for:** Seed id resolution; On the Radar pool/panel/`verify:radar`; `useDossierDrawer`; scoring v1.1; UI polish + mobile court fix
- **Not used for:** Vendor tier choice (user: one paid GOAT month); full search combobox ARIA

### 2026-07-30 — Lineup Fit panel (PR 1 of 2)
- **Tool:** Cursor agent
- **Used for:** `composeTeamFit` + `/api/team-fit` + `TeamFitPanel`; four-column layout; review fixes (empty/partial gates, retry focus, skeleton status); docs cleanup
- **Not used for:** Scoring semantics (user-approved means / thresholds / “Lineup Fit” framing); swap simulation (PR 2)

### 2026-08-01 — Lineup swap (PR 2 of 2)
- **Tool:** Cursor agent
- **Used for:** `useLineupSim` + Radar DnD/swap icon; Fit deltas vs baseline; Reset; outline/identity carve-out
- **Not used for:** Trade packages, salary, synergy/+/- modeling

### 2026-08-01 — Spotlight tour
- **Tool:** Cursor agent
- **Used for:** Optional Tutorial control + live `data-tour` coach marks (scrim cutout, keyboard, reduced-motion)
- **Not used for:** Auto-blocking first-visit onboarding

### 2026-08-01 — Phase 3 polish
- **Tool:** Cursor agent
- **Used for:** Shared percentile bar tones (70/45); README/DEVELOPMENT/VENDOR sync
- **Not used for:** Search combobox ARIA / dialog `inert` (still deferred)

### 2026-08-01 — Write-up
- **Tool:** Cursor agent
- **Used for:** Draft [`WRITEUP.md`](./WRITEUP.md) + [`FINAL_QA.md`](./FINAL_QA.md) from existing docs
- **Not used for:** Inventing scoring claims beyond documented methodology

### 2026-08-01 — Post-stack local iteration
- **Tool:** Cursor agent
- **Used for:** Bench↔starter true exchange; swap icon UX; Fit reset banner; Radar angle in dossier; Tutorial placement/a11y; docs sync after local testing
- **Not used for:** Multi-slot stacked swaps / trade packages
