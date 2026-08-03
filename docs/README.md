# RosterRadar docs

Single map for humans and AI. Prefer this index over opening every file.

**Live:** https://roster-radar-orcin.vercel.app  
**Repo status:** MVP shipped on `main` (write-up + post-ship features through PR #24, 2026-08-02).

---

## Read in this order

| # | Doc | Use when you need… |
|---|---|---|
| 1 | [`WRITEUP.md`](./WRITEUP.md) | Assignment narrative (submit this) |
| 2 | [`IDENTITY.md`](./IDENTITY.md) | What v1 is / isn’t (product locks) |
| 3 | [`PROJECT_OUTLINE.md`](./PROJECT_OUTLINE.md) | Original plan + assignment alignment |
| 4 | [`BACKEND.md`](./BACKEND.md) | Ports/adapters, APIs, scoring boundaries |
| 5 | [`VENDOR_DECISION.md`](./VENDOR_DECISION.md) | Why BALLDONTLIE, not NBA.com on Vercel |
| 6 | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Tokens, UX rules, fit colors |
| 7 | [`DEVELOPMENT.md`](./DEVELOPMENT.md) | Phases, git workflow, definition of done |
| 8 | [`FINAL_QA.md`](./FINAL_QA.md) | Production smoke checklist |
| 9 | [`AI_USAGE.md`](./AI_USAGE.md) | AI disclosure log (assignment requirement) |

### Historical phase notes (do not treat as current product truth)
| Doc | Covers |
|---|---|
| [`PHASE_1_REVIEW.md`](./PHASE_1_REVIEW.md) | Scaffold + first deploy |
| [`PHASE_2_REVIEW.md`](./PHASE_2_REVIEW.md) | Dossier vertical slice |
| [`PHASE_3_REVIEW.md`](./PHASE_3_REVIEW.md) | Harden, Radar, Fit, swap, tour |

If a phase review conflicts with `IDENTITY` / `WRITEUP` / `DEVELOPMENT`, **trust the latter three**.

---

## Current product (one screen)

| Surface | Behavior |
|---|---|
| Nets home | Half-court starters + bench; curated headshots |
| Dossier drawer | Role, fit grade, pillars, callouts, evidence, methodology |
| Search | Non-Nets only → same dossier; swap / Try in lineup |
| Lineup Fit | Starting-five peer aggregation + deltas under sim |
| On the Radar | Full curated pool, vertical scroll, Shuffle, pillar sort |
| Lineup sim | Stacked one-for-one slot swaps; Out return; Reset |
| Tutorial | Optional intro + bullets per region |

**Out of v1:** auth, multi-team home, film/tracking, salary/cap, full trade packages, team +/− / synergy, guaranteed search headshots, compare-two-players, “Evaluate as” role toggle.

---

## API surface (v1)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/players?q=` | Non-Nets search (+ best-effort headshots) |
| `GET` | `/api/dossier/[id]` | Role-fit dossier |
| `GET` | `/api/team-fit?ids=` | Lineup Fit for five ids |
| `GET` | `/api/radar-scores?pillar=&ids=` | Season-line pillar ranks for Radar sort |

---

## Cursor rules

Project agent rules live in [`.cursor/rules/`](../.cursor/rules/) (product, git, root-cause, TS/React, backend, UI).
