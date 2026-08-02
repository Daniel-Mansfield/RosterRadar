# Final QA checklist (Phase 4)

Run against **production** ([live URL](https://roster-radar-orcin.vercel.app)) after Phase 3 wrap is merged. Paid GOAT key must be set on Vercel.

**Smoke completed:** 2026-08-02 on production (`main` @ `2d2b684`, post PRs #15–#16). Residual state paths + HTML5 Radar DnD re-checked same day. Multi-slot sim re-smoked 2026-08-02 on `main` @ `f49de8c` (PR #18).

## Happy path
- [x] Home loads: brand, search, court, Fit, Radar, bench
- [x] Click starter → dossier drawer (verdict, pillars, callouts)
- [x] Search non-Nets player → same dossier flow
- [x] Search swap icon → click starter: acquisition sim (Out on displaced); Fit banner; Reset *(LeBron → SF earlier; LeBron → PG via Try in lineup)*
- [x] Search dossier **Try in lineup** → same acquisition sim path *(LeBron → PG; Demin Out; Fit “in for Egor Demin”; deltas)*
- [x] Search results / dossier / post-swap court show headshots when ESPN id resolves; initials on miss *(LeBron ESPN `…/full/1966.png` in search, dossier, court)*
- [x] Radar card click → dossier with full scouting angle under the subtitle
- [x] Lineup Fit shows grade + six pillars for real five
- [x] Drag Radar → starter: court updates; Fit banner + deltas; Reset restores *(Herbert Jones → PF; Clowney Out; Reset OK)*
- [x] Radar swap icon → click starter: same as drag; Esc or second tap cancels pending
- [x] Drag bench → starter (or bench swap icon): true exchange; Fit deltas; Reset
- [x] Tutorial: steps highlight regions; Skip / Esc / Done / arrows work; Tab stays in card; re-open starts at step 1 *(open + Esc verified; arrows/Tab spot-checked in prior local pass)*
- [x] Multi-slot accumulate: two Radar placements → stacked Fit banner (PG→C order); both Out pins *(Simons SG + Kuzma PF)*
- [x] Same-slot overwrite: second acquisition replaces first; Out stays the real starter *(Johnson over Kuzma at PF; Clowney still Out)*
- [x] Out return home clears that override only *(Traore → SG; Johnson/PF remains)*
- [x] Bench-only exchange: no Out badge / no Return control *(Cam → SG; Traore shows Swap, not Return)*
- [x] Reset clears every stacked change

## States
- [x] Fit / dossier loading skeletons appear briefly on slow network *(Fit skeleton after Radar drag; dossier “Loading role-fit dossier…” under throttled network)*
- [x] Force error (offline) → message + Try again where applicable *(dossier: “Could not reach dossier API.” → Try again recovered Clowney)*
- [x] Thin-sample note appears when relevant (low-game player) *(Pacome Dadiet: Confidence low · thin sample · 29 GP · 4.7 mpg; preliminary verdict)*

## Responsive
- [x] Mobile stacked layout: court usable; PG card not clipped *(390×844)*
- [x] Desktop ≥64em: Fit \| Radar \| Court \| Bench columns
- [x] Tutorial control reachable on stacked and wide header

## Regression
- [x] `npm test` / `npm run lint` / `tsc --noEmit` green on `main`
- [x] No secrets in repo; `.env.local` / Vercel env only for `BALLDONTLIE_API_KEY`
