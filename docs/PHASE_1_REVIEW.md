# Phase 1 code review log

Self-review of Phase 1 (`phase-1/scaffold`) before merge. Findings and remediations are tracked here so future debugging can distinguish intentional tradeoffs from leftover debt.

## Review date
2026-07-26

## Severity legend
| Level | Meaning |
|---|---|
| P0 | Accuracy / merge blocker for upcoming dossier work |
| P1 | Quality bar (boundaries, a11y, ops) |
| P2 | Hygiene / maintainability |

## Findings → disposition

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| R1 | P0 | Synthetic negative player ids looked fetchable | **Fixed:** seed/`RosterPlayer.id` is `number \| null`; React keys via `rosterPlayerKey`; never invent negative ids |
| R2 | P0 | Search fired every keystroke → BDL 429 risk | **Fixed:** 280ms debounce + AbortController in `AcquisitionSearch` |
| R3 | P1 | Client cast API JSON without Zod | **Fixed:** `playersApiResponseSchema` / `apiErrorSchema` in `src/lib/api/schemas.ts` |
| R4 | P1 | `excludeNets` only checked `BKN` abbreviation | **Fixed:** also exclude curated seed name keys |
| R5 | P1 | Drawer lacked Escape / focus restore / trap | **Fixed:** basic dialog keyboard behavior in `NetsHome` |
| R6 | P1 | Muted text contrast on graphite likely below AA | **Fixed:** `--content-muted` mixes dim-grey toward white |
| R7 | P1 | Page vs route used different roster access paths | **Fixed:** shared `loadNetsRoster()` |
| R8 | P2 | `AppError` colocated with player types | **Fixed:** `src/domain/errors.ts` |
| R9 | P2 | Duplicated route error JSON | **Fixed:** `toErrorResponse()` |
| R10 | P2 | Duplicated query length rules | **Fixed:** shared `searchQuerySchema` |
| R11 | P2 | Zod `.passthrough()` retained unknown vendor fields | **Fixed:** strip unknown keys (default) |
| R12 | P2 | Seed could silently duplicate starter slots | **Fixed:** `assertValidNetsSeed` in adapter |
| R13 | P0/P2 | Many seed BDL ids still unresolved | **Partial:** resolved ids where API allowed; remaining `null` documented below |

## Seed id status (post-review)

| Player | BDL id | Notes |
|---|---|---|
| Egor Demin | `1057266813` | Resolved |
| Nolan Traore | `null` | Search only returned a different Traore — do not guess |
| Michael Porter Jr. | `375` | Known |
| Noah Clowney | `56677843` | Known |
| Nic Claxton | `666508` | BDL name “Nicolas Claxton”; team field may lag |
| Cam Thomas | `null` | Rate-limited / last-name search too broad — resolve later |
| Terance Mann | `666743` | Resolved |
| Ziaire Williams | `null` | Resolve later |
| Day'Ron Sharpe | `17896038` | Resolved |
| Jalen Wilson | `56677722` | Resolved (BDL team may not show BKN) |
| Ochai Agbaji | `null` | Rate-limited — resolve later |
| Danny Wolf | `1057280779` | Resolved |
| Drake Powell | `1057279425` | Resolved |
| Ben Saraf | `1057279760` | Resolved |

## Deferred (not blocking Phase 1 merge)
- Unit tests for adapter mapping / seed validation (Phase 2 scoring tests take priority)
- Full focus-trap library / inert backdrop (current Escape + Tab cycle is enough for v1 drawer)
- Hello-world Vercel deploy (still Phase 1 checklist item, separate from code quality)
- Scaffold clutter (`AGENTS.md`, default public SVGs) — optional cleanup

## How to use this doc
When something breaks in Phase 2 (especially dossier-by-id), check **Seed id status** first: `null` ids must not be passed to BALLDONTLIE.
