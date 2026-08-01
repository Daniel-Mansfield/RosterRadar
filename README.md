# RosterRadar

Scouting dossiers that grade NBA players by role, not just box scores.

**RosterRadar** helps NBA decision-makers judge a player’s roster fit in under a minute — verdict first, evidence second.

## Intentions & decisions

| Area | Decision |
|---|---|
| **Audience** | NBA team decision-makers (FO / scouting staff mindset) — not a fan fantasy tool or player selfie app |
| **Product** | Role-aware **scouting dossier**: search a player → fit grade, role pillars, strengths/risks, evidence |
| **UX model** | Leetify-like clarity (verdict first, sub-scores, callouts) + Cleaning the Glass seriousness; progressive disclosure |
| **Differentiator** | Grade by **role fit**, not a generic box-score dump; opinionated Strong / Conditional / Poor recommendation |
| **Scope** | Small 10-day MVP; ship search + one-player dossier; compare / role toggle only if ahead |
| **Non-goals (v1)** | Auth, film, tracking, salary/cap, full trade packages / +/- projections, social, live tools |
| **Frontend** | Opinionated, easy, responsive; one accent; semantic design tokens; WCAG AA contrast |
| **Backend** | Backend owns interpretation; frontend owns presentation; ports/adapters; pure scoring; Zod at boundaries |
| **API surface** | `GET /api/players`, `GET /api/dossier/[id]`, `GET /api/team-fit` → typed JSON |
| **Data** | [BALLDONTLIE](https://docs.balldontlie.io/) (GOAT) behind `NbaStatsPort` — [`docs/VENDOR_DECISION.md`](docs/VENDOR_DECISION.md) |
| **Stack** | TypeScript, React, Next.js, Vercel |
| **Quality bar** | Clean, maintainable code; root-cause fixes (no quick-fix patches); original scoring + AI disclosed |
| **Process** | Phase-by-phase (`docs/DEVELOPMENT.md`); branch off `main`, named commits, merge after testing |

## Project docs
- Full outline: [`docs/PROJECT_OUTLINE.md`](docs/PROJECT_OUTLINE.md)
- Identity / drawing board: [`docs/IDENTITY.md`](docs/IDENTITY.md)
- Backend design: [`docs/BACKEND.md`](docs/BACKEND.md)
- Vendor & hosting decision: [`docs/VENDOR_DECISION.md`](docs/VENDOR_DECISION.md)
- Design system: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- Development phases: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- Phase reviews: [`PHASE_1`](docs/PHASE_1_REVIEW.md) · [`PHASE_2`](docs/PHASE_2_REVIEW.md) · [`PHASE_3`](docs/PHASE_3_REVIEW.md)
- AI disclosure: [`docs/AI_USAGE.md`](docs/AI_USAGE.md)
- Assignment write-up: [`docs/WRITEUP.md`](docs/WRITEUP.md)
- Final QA checklist: [`docs/FINAL_QA.md`](docs/FINAL_QA.md)
- Cursor rules: [`.cursor/rules/`](.cursor/rules/)

## Live demo
[https://roster-radar-orcin.vercel.app](https://roster-radar-orcin.vercel.app)

## Status
Phase 3 wrap + write-up drafted. Vendor: BALLDONTLIE GOAT (paid demo month; fixtures fallback). Merge Phase 3 PRs → run [`FINAL_QA.md`](docs/FINAL_QA.md) on production.

## Setup
Copy `.env.example` → `.env.local` and set `BALLDONTLIE_API_KEY`. Never commit secrets. For Vercel, set the same key on Production/Preview (Dashboard → Settings → Environment Variables).
