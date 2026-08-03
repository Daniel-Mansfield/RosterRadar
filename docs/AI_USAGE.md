# AI usage disclosure

RosterRadar’s **concept, scoring model, and product decisions are original** (role-fit scouting dossier for NBA decision-makers). AI tools assist with planning, documentation, and implementation; they do not own the central idea.

This log supports the assignment requirement to disclose AI use. Keep entries summary-style; append when a phase or major feature uses AI.

Docs map: [`README.md`](./README.md). Write-up summary: [`WRITEUP.md`](./WRITEUP.md) §9.

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

## Log index (scan first)

| Date | Entry | AI used for |
|---|---|---|
| 2026-07-26 | Phase 0–1 foundation | Framing, outline, scaffold, Nets home shell |
| 2026-07-27 | Vendor + Phase 2 dossier | Vendor spike, scoring/, dossier API/UI |
| 2026-07-28 | Phase 3 harden + Radar | Seed ids, On the Radar, scoring v1.1 |
| 2026-07-30 | Lineup Fit (PR 1) | composeTeamFit, team-fit API, panel |
| 2026-08-01 | Lineup swap (PR 2) | useLineupSim, DnD, Fit deltas |
| 2026-08-01 | Spotlight tour | Tutorial coach marks |
| 2026-08-01 | Phase 3 polish | Shared percentile tones, docs sync |
| 2026-08-01 | Write-up | WRITEUP + FINAL_QA drafts |
| 2026-08-01 | Post-stack local iteration | Bench exchange, swap UX, tour a11y |
| 2026-08-02 | Multi-slot lineup sim | Accumulated slot overrides |
| 2026-08-02 | Radar gap reorder | Pillar sort API + full-pool Radar + tour bullets |
| 2026-08-02 | Docs parseable cleanup | Docs index + stale IDENTITY / QA sync |
| 2026-08-02 | README + write-up polish | Portfolio README; WRITEUP demo walkthrough / reflections stub |

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

### 2026-08-02 — Multi-slot lineup sim
- **Tool:** Cursor agent
- **Used for:** Accumulated slot overrides (`lineupSim` + `useLineupSim`); stacked Fit banner; Out-pin return; overwrite same slot; docs/tour copy
- **Not used for:** Trade packages, salary, synergy/+/-

### 2026-08-02 — Radar gap reorder
- **Tool:** Cursor agent
- **Used for:** Gap-aware Radar shortlist reorder (`radarGapReorder`, `/api/radar-scores`, pillar picker + full-pool vertical scroll); tutorial intro + bullets; season-line pillar scores only
- **Not used for:** League-wide attribute search

### 2026-08-02 — Docs parseable cleanup
- **Tool:** Cursor agent
- **Used for:** `docs/README.md` reading-order index; sync stale IDENTITY keep/cut/later, README status, WRITEUP/DEVELOPMENT/FINAL_QA/BACKEND pointers
- **Not used for:** Product behavior changes

### 2026-08-02 — UI motion polish
- **Tool:** Cursor agent
- **Used for:** CSS-first motion tokens; dossier drawer enter/exit; Fit/dossier content enter; Radar sort reorder cue; card press feedback
- **Not used for:** Framer Motion / GSAP; decorative marketing animation

### 2026-08-02 — README + write-up polish
- **Tool:** Cursor agent
- **Used for:** Portfolio-style root README; WRITEUP structure (demo walkthrough, scoring example, QA SHA, reflections stub); docs map / FINAL_QA sync
- **Not used for:** Personal reflections copy (author-owned)
