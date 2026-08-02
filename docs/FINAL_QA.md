# Final QA checklist (Phase 4+)

Run against **production** ([live URL](https://roster-radar-orcin.vercel.app)). Paid GOAT key must be set on Vercel.

Docs map: [`README.md`](./README.md).

## Smoke log

| Date | `main` SHA | Coverage |
|---|---|---|
| 2026-08-02 | `2d2b684` | Core MVP + search swap/headshots (PRs #15–#16) |
| 2026-08-02 | `f49de8c` | Multi-slot lineup sim (PR #18) |
| 2026-08-02 | `1ddde0e` | Radar full pool + pillar sort + tutorial bullets (PR #20) — local + Vercel preview before merge |

Re-check residual / DnD paths on production after each merge listed above. Pillar-sort rows below were verified on the feature branch / preview; spot-check on production if the deploy SHA matches.

---

## Happy path

- [x] Home loads: brand, search, court, Fit, Radar, bench
- [x] Click starter → dossier drawer (verdict, pillars, callouts)
- [x] Search non-Nets player → same dossier flow
- [x] Search swap icon → click starter: acquisition sim (Out on displaced); Fit banner; Reset
- [x] Search dossier **Try in lineup** → same acquisition sim path
- [x] Search results / dossier / post-swap court show headshots when ESPN id resolves; initials on miss
- [x] Radar card click → dossier with full scouting angle under the subtitle
- [x] Lineup Fit shows grade + six pillars for real five
- [x] Drag Radar → starter: court updates; Fit banner + deltas; Reset restores
- [x] Radar swap icon → click starter: same as drag; Esc or second tap cancels pending
- [x] Drag bench → starter (or bench swap icon): true exchange; Fit deltas; Reset
- [x] Tutorial: steps highlight regions; intro + bullets; Skip / Esc / Done / arrows; Tab stays in card; re-open starts at step 1
- [x] Multi-slot accumulate: two Radar placements → stacked Fit banner; both Out pins
- [x] Same-slot overwrite: second acquisition replaces first; Out stays the real starter
- [x] Out return home clears that override only
- [x] Bench-only exchange: no Out badge / no Return control
- [x] Reset clears every stacked change
- [x] On the Radar shows the full curated pool (~14) in a **vertical** scroll
- [x] Pillar picker defaults to lineup need when Fit loads; **Sort** reorders; status “Sorted by …”
- [x] Changing pillar reorders; Shuffle clears sort status and redraws the list

## States

- [x] Fit / dossier loading skeletons appear briefly on slow network
- [x] Force error (offline) → message + Try again where applicable
- [x] Thin-sample note appears when relevant (low-game player)

## Responsive

- [x] Mobile stacked layout: court usable; PG card not clipped *(390×844)*
- [x] Desktop ≥64em: Fit \| Radar \| Court \| Bench columns
- [x] Tutorial control reachable on stacked and wide header

## Regression

- [x] `npm test` / `npm run lint` / `tsc --noEmit` green on `main`
- [x] No secrets in repo; `.env.local` / Vercel env only for `BALLDONTLIE_API_KEY`
