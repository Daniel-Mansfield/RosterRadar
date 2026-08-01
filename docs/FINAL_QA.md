# Final QA checklist (Phase 4)

Run against **production** ([live URL](https://roster-radar-orcin.vercel.app)) after Phase 3 wrap is merged. Paid GOAT key must be set on Vercel.

## Happy path
- [ ] Home loads: brand, search, court, Fit, Radar, bench
- [ ] Click starter → dossier drawer (verdict, pillars, callouts)
- [ ] Search non-Nets player → same dossier flow
- [ ] Radar card click → dossier with full scouting angle under the subtitle
- [ ] Lineup Fit shows grade + six pillars for real five
- [ ] Drag Radar → starter: court updates; Fit banner + deltas; Reset restores
- [ ] Radar swap icon → click starter: same as drag; Esc or second tap cancels pending
- [ ] Drag bench → starter (or bench swap icon): true exchange; Fit deltas; Reset
- [ ] Tutorial: steps highlight regions; Skip / Esc / Done / arrows work; Tab stays in card; re-open starts at step 1

## States
- [ ] Fit / dossier loading skeletons appear briefly on slow network
- [ ] Force error (offline) → message + Try again where applicable
- [ ] Thin-sample note appears when relevant (low-game player)

## Responsive
- [ ] Mobile stacked layout: court usable; PG card not clipped
- [ ] Desktop ≥64em: Fit \| Radar \| Court \| Bench columns
- [ ] Tutorial control reachable on stacked and wide header

## Regression
- [ ] `npm test` / `npm run lint` / `tsc --noEmit` green on `main`
- [ ] No secrets in repo; `.env.local` / Vercel env only for `BALLDONTLIE_API_KEY`
