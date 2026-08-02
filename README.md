# RosterRadar

Scouting dossiers that grade NBA players by role, not just box scores.

**RosterRadar** helps NBA decision-makers judge a player’s roster fit in under a minute — verdict first, evidence second.

**Live demo:** [https://roster-radar-orcin.vercel.app](https://roster-radar-orcin.vercel.app)

## Status

**MVP shipped** (2026-08-02). Phase 4 write-up + production QA complete; post-ship features include multi-slot lineup sim and Radar pillar sort (PR #20).

Docs map (start here): [`docs/README.md`](docs/README.md)  
Assignment write-up: [`docs/WRITEUP.md`](docs/WRITEUP.md)

## Intentions & decisions

| Area | Decision |
|---|---|
| **Audience** | NBA FO / scouting staff mindset — not a fan fantasy tool |
| **Product** | Role-aware **scouting dossier**: fit grade, role pillars, strengths/risks, evidence |
| **UX model** | Leetify-like clarity + Cleaning the Glass seriousness; progressive disclosure |
| **Differentiator** | Grade by **role fit**, not a generic box-score dump |
| **Scope** | Small 10-day MVP; compare / role toggle stretch **skipped** |
| **Non-goals (v1)** | Auth, film, tracking, salary/cap, full trade packages / +/−, social, live tools |
| **Frontend** | Opinionated, responsive; one accent; semantic tokens; WCAG AA contrast |
| **Backend** | Backend owns interpretation; ports/adapters; pure scoring; Zod at boundaries |
| **API surface** | `GET /api/players`, `/api/dossier/[id]`, `/api/team-fit`, `/api/radar-scores` |
| **Data** | [BALLDONTLIE](https://docs.balldontlie.io/) (GOAT) — [`docs/VENDOR_DECISION.md`](docs/VENDOR_DECISION.md) |
| **Stack** | TypeScript, React, Next.js, Vercel |
| **Quality bar** | Root-cause fixes; original scoring + AI disclosed |
| **Process** | Branch off `main`; named commits; merge after testing — [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) |

## Project docs

Full index and reading order: [`docs/README.md`](docs/README.md).

| Doc | Role |
|---|---|
| [`docs/WRITEUP.md`](docs/WRITEUP.md) | Assignment submission narrative |
| [`docs/IDENTITY.md`](docs/IDENTITY.md) | Product locks / keep·cut·later |
| [`docs/PROJECT_OUTLINE.md`](docs/PROJECT_OUTLINE.md) | Original plan + assignment alignment |
| [`docs/BACKEND.md`](docs/BACKEND.md) | Architecture + API contracts |
| [`docs/VENDOR_DECISION.md`](docs/VENDOR_DECISION.md) | Data vendor decision record |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Visual / UX tokens |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Phases + definition of done |
| [`docs/FINAL_QA.md`](docs/FINAL_QA.md) | Production smoke checklist |
| [`docs/AI_USAGE.md`](docs/AI_USAGE.md) | AI disclosure log |
| Phase reviews | [`1`](docs/PHASE_1_REVIEW.md) · [`2`](docs/PHASE_2_REVIEW.md) · [`3`](docs/PHASE_3_REVIEW.md) (historical) |
| Cursor rules | [`.cursor/rules/`](.cursor/rules/) |

## Setup

```bash
cp .env.example .env.local
# Add BALLDONTLIE_API_KEY from https://balldontlie.io
npm install
npm run dev
```

Never commit secrets. On Vercel, set `BALLDONTLIE_API_KEY` for Production and Preview.
