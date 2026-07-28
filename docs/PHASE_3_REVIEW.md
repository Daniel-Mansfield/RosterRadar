# Phase 3 review debt

Continues the QA convention from [`PHASE_2_REVIEW.md`](./PHASE_2_REVIEW.md).

## "On the Radar" review (2026-07-28)

Self-review of `phase-3/on-the-radar` before PR.

### Fixed in this pass

| ID | Issue | Fix |
|---|---|---|
| P3-1 | `NetsHome` import block split by the `dynamic()` declaration | All imports first; client-only `OnTheRadar` const after the block |
| P3-2 | `.radarPane` `overflow: hidden` silently clipped rows on short viewports | `overflow-y: auto` — scrollbar only when needed |
| P3-3 | Radar `aside` `aria-label` duplicated the visible heading | `aria-labelledby` on the `useId`-linked `<h2>` |
| P3-4 | `VENDOR_DECISION.md` still showed post-trial path as open | Recorded 2026-07-28 decision: one paid GOAT month |
| P3-5 | `set-state-in-effect` pattern pre-existing in `PlayerAvatar` (found via lint while building the panel) | Track failed **id** instead of boolean; effect removed |

### Improvements pass (2026-07-28, same branch)

| ID | Issue | Fix |
|---|---|---|
| P3-6 | Radar row accessible name omitted team/position/angle | Dropped `aria-label`; visible content is the accessible name, prefixed by an `.srOnly` "Open dossier for" |
| P3-7 | `RADAR_POOL` teams/ids go stale as players move | `npm run verify:radar` — one batched BDL call + ESPN per candidate; exits 1 on drift (run before demos) |
| P3-8 | `NetsHome` owned three `openFor…` flows + drawer state/a11y (carried P2-7) | Extracted `useDossierDrawer` (state machine, stale-response invalidation, focus trap/Escape/scroll lock/focus restore); `NetsHome` 406 → 262 lines. Also fixed a latent race: the "unavailable" path did not invalidate in-flight fetches, so a late response could replace the drawer with a different player |
| P3-9 | `package.json` enumerated test files by hand | `tsx --test $(find src -name '*.test.ts' \| sort)` — auto-discovery (Node 20 `--test` lacks glob support; `find` works on macOS + Ubuntu CI) |

Manual pass after P3-8 (all through the hook): court open → ready; Escape close + scroll-lock release; radar keyboard-focused open → ready → Close → focus restored to origin row; bench open (Cam Thomas, validates resolved seed id) → backdrop close; search "Kessler" → select → ready from server cache. Plus 30/30 tests, `tsc`, eslint.

### Scoring pass (2026-07-28, `rr-role-fit-v1.1`)

| ID | Issue | Fix |
|---|---|---|
| P3-10a | Role inference: first-match creator branch used absolute thresholds only, so bigs with incidental assist ranks (~3 apg ≈ 70th pct league-wide) out-ranked their dominant paint profile (Kessler: playmaking 73 vs rebounding 98 → "Primary creator") | Creator read now requires playmaking to stand up to rebounding (`CREATOR_DOMINANCE_MARGIN` 15); elite dual bigs (Jokić shape, 97 vs 98) still read creator. Also unified pillar percentiles into one `pillarPercentiles()` source used by both `detectRole` and `buildPillars` so they cannot drift |
| P3-10b | "Strong fit — build around" rendered beside "low confidence · thin sample · 5 GP" | Thin samples cap the recommendation at Conditional (grade stays honest) and the verdict appends "Thin sample — treat as a preliminary read" |
| P3-12 | `openDossier` contract check threw inside the fire-and-forget async task (unhandled rejection) | Null-id check moved to the synchronous wrapper; `loadDossier` takes `playerId: number` |

Verified: Kessler (5 GP) now "Paint anchor · Conditional 75 · preliminary"; Cam Thomas (42 GP) unchanged shape "Wing scorer · poor 44 · high confidence". 35/35 tests (5 new: dominance margin both directions, thin-sample cap, compose end-to-end both paths).

### UI polish pass (2026-07-28, `phase-3/ui-polish`)

| ID | Issue | Fix |
|---|---|---|
| P3-13 | Radar panel felt under-weighted next to the court: rows hugged the top of a court-height column | Panel fills the column (`height: 100%`, list `space-between`); rows upsized (56px avatars, larger type/padding) |
| P3-14 | Radar shortlist only rotated on reload | Header shuffle button re-runs `pickRadarCandidates` (static pool — no API cost); spin animation gated behind `prefers-reduced-motion: no-preference` |
| P3-15 | Drawer error state was a dead end — a transient failure (offline, 429) forced close + reopen | `useDossierDrawer` exposes `retryDossier()`; "Try again" renders only for `error` (not `unavailable`, which has no id). Closes the Phase 2 "rate-limit UX" residual |
| P3-16 | Search placeholder said "Search a player…" though only non-Nets players are searchable | "Search non-Nets players…" — matches the region's accessible name. Later simplified to "Search players…" per user preference; aria-label keeps the full description |
| P3-17 | Drawer loading state was a plain text line | `DossierSkeleton` echoes the hero + pillars layout (quiet grey bones, shimmer gated behind `prefers-reduced-motion: no-preference`, `role="status"` with hidden loading text) |

Verified in-browser: shuffle re-rolls the five picks; forced offline (CDP) → error + Try again → network restored → retry loads the dossier end-to-end.

Keyboard-nav audit of search results: rows are real buttons, so Tab/Shift-Tab + Enter work today. Full ARIA combobox semantics (arrow keys, `aria-activedescendant`) deferred — meaningful scope for marginal gain at this list size.

### Mobile / responsive pass (2026-07-28, `phase-3/mobile-pass`)

| ID | Issue | Fix |
|---|---|---|
| P3-11 | Stacked (<64em) layout: court `aspect-ratio` + `max-height` made the panel shorter than three card rows; `overflow: hidden` clipped the PG card to a sliver | Height follows card rows (no aspect-ratio lock on stacked). Court art uses `background-size: cover` as the mobile-first base — may crop painted spots slightly; preferred over clipping the PG. Desktop (≥64em) resets to inset `82%` + aspect-ratio |
| P3-18 | Radar stretch (`height: 100%`, `space-between`, growing rows) was desktop-gutter logic applied at every width | Scoped stretch styles to `min-width: 64em`; stacked layout keeps natural-height, `flex-start` rows |
| P3-19 | HalfCourt stacked overrides lived in `max-width: 63.98em` (inverted vs mobile-first rule) | Base = stacked (`cover`, row-gap); desktop enhancements under `min-width: 64em` only |

Verified: PG (Egor Demin) fully inside the court at 390×844 and 768×1024; drawer opens full-width on phone with scroll; desktop radar still fills the court-height column (770px = court height at 1512w).

### Residual / later

| ID | Issue | Notes |
|---|---|---|
| — | Full ARIA combobox for search (arrow keys / `aria-activedescendant`) | Deferred from UI polish; Tab/Enter already work |
