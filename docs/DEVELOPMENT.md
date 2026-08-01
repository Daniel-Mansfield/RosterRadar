# Development process

Phased plan for RosterRadar. Product/architecture detail lives in [`PROJECT_OUTLINE.md`](./PROJECT_OUTLINE.md), [`BACKEND.md`](./BACKEND.md), and [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

## Git workflow

**Do not develop directly on `main`.** Branch → change → test → merge.

| Rule | Practice |
|---|---|
| Default branch | `main` stays stable / deployable |
| Work branches | Create from up-to-date `main` for each phase or feature |
| Commits | Clear message (what/why); never unnamed |
| Before merge | Test locally; fix at the root cause |
| Merge | Into `main` only after the branch is validated |
| Push | Work branch for PRs; `main` after merge |

Branch names: `phase-N/…`, `feat/…`, `fix/…`, `docs/…`, `chore/…`.

## Phase checklist

### Phase 0 — Foundation
- [x] Outline, design system, backend design, Cursor rules, AI log, `.env.example`

### Phase 1 — Runnable skeleton
- [x] Next.js + tokens + BDL adapter + Nets home (court / bench / drawer / search)
- [x] Merged (PR #1) + Vercel hello deploy — [`PHASE_1_REVIEW.md`](./PHASE_1_REVIEW.md)

### Vendor
- [x] Locked: BALLDONTLIE GOAT — [`VENDOR_DECISION.md`](./VENDOR_DECISION.md)
- [x] `npm run verify:goat` PASS
- [x] Post-trial path: one paid GOAT month for the demo window (fixtures = fallback)

### Phase 2 — Dossier vertical slice
- [x] Pure `scoring/` + tests; `GET /api/dossier/[id]`; drawer UI; TTL cache
- [x] Merged (PR #3) — [`PHASE_2_REVIEW.md`](./PHASE_2_REVIEW.md)
- [x] `BALLDONTLIE_API_KEY` on Vercel preview/production

### Phase 3 — Harden + additions
- [x] Dossier surfaces (loading / error / thin-sample / retry)
- [x] On the Radar; seed ids; scoring v1.1; mobile court fix
- [x] Lineup Fit panel (PR 1) — team-level read for the starting five
- [x] Lineup swap (PR 2) — one-for-one Radar→starter sim + Fit deltas
- [ ] Spotlight tutorial; residual polish — [`PHASE_3_REVIEW.md`](./PHASE_3_REVIEW.md)

### Phase 4 — Ship
- [ ] Stretch only if ahead (compare / role toggle)
- [ ] Write-up + AI disclosure + final QA + live URL

## Definition of done
1. Types + boundary validation correct (no `any` on vendor JSON)
2. Failures fixed at the right layer (adapter vs scoring vs UI)
3. Happy path **and** loading / empty / error (or thin-sample) handled
4. Pure scoring changes include a unit test
5. Docs / AI log updated when architecture or AI assistance changes
6. Work on a **branch**; merge to `main` only after testing

## Local setup
```bash
cp .env.example .env.local
# Add BALLDONTLIE_API_KEY from https://balldontlie.io
npm install
npm run dev
```
