# Final QA checklist (Phase 4)

Run against **production** ([live URL](https://roster-radar-orcin.vercel.app)) after Phase 3 wrap PRs are merged. Paid GOAT key must be set on Vercel.

## Happy path
- [ ] Home loads: brand, search, court, Fit, Radar, bench
- [ ] Click starter → dossier drawer (verdict, pillars, callouts)
- [ ] Search non-Nets player → same dossier flow
- [ ] Radar card click → dossier
- [ ] Lineup Fit shows grade + six pillars for real five
- [ ] Drag Radar → starter: court updates; Fit shows deltas; Reset restores
- [ ] Place → click starter: same as drag; Esc cancels Place
- [ ] Tour: steps highlight regions; Skip / Esc / Done work; re-open starts at step 1

## States
- [ ] Fit / dossier loading skeletons appear briefly on slow network
- [ ] Force error (offline) → message + Try again where applicable
- [ ] Thin-sample note appears when relevant (low-game player)

## Responsive
- [ ] Mobile stacked layout: court usable; PG card not clipped
- [ ] Desktop ≥64em: Fit \| Radar \| Court \| Bench columns
- [ ] Tour button reachable on stacked and wide header

## Regression
- [ ] `npm test` / `npm run lint` / `tsc --noEmit` green on `main`
- [ ] No secrets in repo; `.env.local` / Vercel env only for `BALLDONTLIE_API_KEY`
