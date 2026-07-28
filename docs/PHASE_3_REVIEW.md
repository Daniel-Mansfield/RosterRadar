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

### Residual / later

| ID | Issue | Notes |
|---|---|---|
| P3-6 | Radar row accessible name omits team/position/angle | `aria-label` matches `PlayerCard` convention; consider appending team, or dropping `aria-label` for content |
| P3-7 | `RADAR_POOL` teams/ids go stale as players move | Verified live 2026-07-28; consider `verify:radar` script (like `verify:goat`) to re-check before demos |
| P3-8 | `NetsHome` now owns three `openFor…` flows + drawer state | Strengthens the case for `useDossierDrawer` extraction (carried P2-7) |
| P3-9 | `package.json` enumerates test files by hand | New test files silently skipped if unregistered (bit us once this branch); consider a glob once runner support is confirmed |
| P3-10 | Scoring labeled a 5-GP center "Primary Creator" (Kessler dossier) | Pre-existing role-inference behavior, not radar-specific; check thin-sample role assignment in scoring pass |
