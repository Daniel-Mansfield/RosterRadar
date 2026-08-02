# Phase 3 review

Hardening + product additions after Phase 2. **Historical** — for current product truth see [`IDENTITY.md`](./IDENTITY.md) / [`WRITEUP.md`](./WRITEUP.md) / [`DEVELOPMENT.md`](./DEVELOPMENT.md) (post–Phase 4). Docs map: [`README.md`](./README.md).

## What shipped
- **Seed ids:** Traore / Thomas resolved; diacritic folding in name normalize
- **On the Radar:** curated pool, per-load shuffle, client-only panel, `verify:radar`, shuffle control
- **Drawer:** `useDossierDrawer` (fetch invalidation, focus trap, retry); `DossierSkeleton`; rate-limit “Try again”
- **Scoring v1.1:** creator dominance margin; thin sample caps Strong → Conditional
- **Layout:** radar / court / bench spacing; mobile-first HalfCourt (no PG clip on stacked); even page margins
- **Lineup Fit (PR 1):** `composeTeamFit` + `GET /api/team-fit` + `TeamFitPanel`; four-column desktop; empty/partial id gates; heading focus park on retry
- **Lineup swap (PR 2):** Radar/bench→starter HTML5 DnD + swap-icon path; `useLineupSim`; Fit grade/pillar deltas vs real five; Reset banner; outline carve-out for one-for-one sim (not trade packages)
- **Spotlight tour:** Optional header Tour button; coach marks on search / court / Fit / Radar (reduced-motion + keyboard)

## Residual
| Item | Notes |
|---|---|
| Search combobox ARIA | Arrow keys / `aria-activedescendant` deferred; Tab/Enter work |
| Dialog `inert` | Carried from Phase 1–2 |
| Post-demo data | Paid GOAT month covers the demo window; fixtures remain the documented fallback ([`VENDOR_DECISION.md`](./VENDOR_DECISION.md)) |

### Polish (2026-08-01)
- Shared `percentileBarTone` (70 / 45) for dossier + Lineup Fit bars — aligned with strength/gap callouts
- README + DEVELOPMENT checklist updated for swap + tour
