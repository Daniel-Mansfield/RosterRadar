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
| **Non-goals (v1)** | Auth, film, tracking, salary/cap, full roster mapper, social, live tools |
| **Frontend** | Opinionated, easy, responsive; one accent; semantic design tokens; WCAG AA contrast |
| **Backend** | Backend owns interpretation; frontend owns presentation; ports/adapters; pure scoring; Zod at boundaries |
| **API surface** | `GET /api/players`, `GET /api/dossier/[id]` → typed dossier JSON |
| **Data** | [BALLDONTLIE](https://docs.balldontlie.io/) (GOAT trial for Phase 2) behind `NbaStatsPort` — see [`docs/VENDOR_DECISION.md`](docs/VENDOR_DECISION.md) |
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
- Phase 1 review log: [`docs/PHASE_1_REVIEW.md`](docs/PHASE_1_REVIEW.md)
- AI disclosure log: [`docs/AI_USAGE.md`](docs/AI_USAGE.md)
- Cursor rules: [`.cursor/rules/`](.cursor/rules/)

## Status
Phase 1 merged. Vendor decision locked (BALLDONTLIE GOAT trial; NBA.com not used on Vercel). Next: verify GOAT endpoints → Phase 2 dossier/scoring.

## Setup
Copy `.env.example` → `.env.local` and set `BALLDONTLIE_API_KEY`. Never commit secrets.
