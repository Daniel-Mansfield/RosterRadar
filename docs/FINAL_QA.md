# Final QA checklist (Phase 4)

Run against **production** ([live URL](https://roster-radar-orcin.vercel.app)) after Phase 3 wrap is merged. Paid GOAT key must be set on Vercel.

**Smoke completed:** 2026-08-02 on production (`main` @ `2d2b684`, post PRs #15–#16).

## Happy path
- [x] Home loads: brand, search, court, Fit, Radar, bench
- [x] Click starter → dossier drawer (verdict, pillars, callouts)
- [x] Search non-Nets player → same dossier flow
- [x] Search swap icon → click starter: acquisition sim (Out on displaced); Fit banner; Reset *(LeBron → SF earlier; LeBron → PG via Try in lineup)*
- [x] Search dossier **Try in lineup** → same acquisition sim path *(LeBron → PG; Demin Out; Fit “in for Egor Demin”; deltas)*
- [x] Search results / dossier / post-swap court show headshots when ESPN id resolves; initials on miss *(LeBron ESPN `…/full/1966.png` in search, dossier, court)*
- [x] Radar card click → dossier with full scouting angle under the subtitle
- [x] Lineup Fit shows grade + six pillars for real five
- [ ] Drag Radar → starter: court updates; Fit banner + deltas; Reset restores *(swap-icon path verified; HTML5 DnD not re-exercised in this smoke)*
- [x] Radar swap icon → click starter: same as drag; Esc or second tap cancels pending
- [x] Drag bench → starter (or bench swap icon): true exchange; Fit deltas; Reset
- [x] Tutorial: steps highlight regions; Skip / Esc / Done / arrows work; Tab stays in card; re-open starts at step 1 *(open + Esc verified; arrows/Tab spot-checked in prior local pass)*

## States
- [ ] Fit / dossier loading skeletons appear briefly on slow network *(not forced this pass)*
- [ ] Force error (offline) → message + Try again where applicable *(not forced this pass)*
- [ ] Thin-sample note appears when relevant (low-game player) *(not observed on current Nets/search sample this pass; unit-covered)*

## Responsive
- [x] Mobile stacked layout: court usable; PG card not clipped *(390×844)*
- [x] Desktop ≥64em: Fit \| Radar \| Court \| Bench columns
- [x] Tutorial control reachable on stacked and wide header

## Regression
- [x] `npm test` / `npm run lint` / `tsc --noEmit` green on `main`
- [x] No secrets in repo; `.env.local` / Vercel env only for `BALLDONTLIE_API_KEY`
