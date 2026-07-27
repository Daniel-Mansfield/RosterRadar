# Development process

Phased plan for RosterRadar. Product/architecture detail lives in [`PROJECT_OUTLINE.md`](./PROJECT_OUTLINE.md), [`BACKEND.md`](./BACKEND.md), and [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

## Git workflow

**Do not develop directly on `main`.** Branch → change → test → merge.

| Rule | Practice |
|---|---|
| Default branch | `main` stays stable / deployable |
| Work branches | Create from up-to-date `main` for each phase or feature |
| Commits | **Always** use a clear commit message (what/why); never leave commits unnamed |
| Before merge | Run/test the change locally (and relevant checks); fix at the root cause |
| Merge | Merge (or PR) into `main` only after the branch is validated |
| Push | Push the work branch to GitHub when sharing or opening a PR; push `main` after merge |

### Branch naming
```
phase-1/scaffold          # phase-scoped work
feat/player-search        # feature
fix/dossier-empty-state  # bugfix
docs/dev-workflow         # documentation only
chore/eslint-config       # tooling
```

### Typical loop
```bash
git checkout main && git pull
git checkout -b phase-1/scaffold
# … implement & test …
git add -A && git commit -m "Describe the change and why."
# optional: git push -u origin HEAD && gh pr create
# after review/validation: merge into main, then delete the branch
```

## Phase checklist

### Phase 0 — Freeze the foundation
- [x] Project outline, design system, backend design, Cursor rules
- [x] `.gitignore`, README doc index
- [x] AI usage log ([`AI_USAGE.md`](./AI_USAGE.md))
- [x] Data vendor locked (BALLDONTLIE — see BACKEND.md; note tier limits)
- [x] `.env.example` (no secrets)
- [x] Planning baseline **committed** to git

### Phase 1 — Runnable skeleton
- [x] Next.js + TypeScript scaffold (strict tsconfig per rules)
- [x] Design tokens in global CSS (Daniel palette)
- [x] Zod + BALLDONTLIE adapter (`searchPlayers`, curated `getNetsRoster`)
- [x] Nets home: brand, half-court, bench, drawer placeholder, non-Nets search
- [x] Pre-merge self-review remediations ([`PHASE_1_REVIEW.md`](./PHASE_1_REVIEW.md))
- [x] Phase 1 merged to `main` (PR #1)
- [ ] Hello-world deploy (e.g. Vercel) — also required for NBA.com spike Proof C
- [x] `.env.local` from `.env.example` (local only; never commit)

### Vendor decision (before Phase 2 scoring)
- [ ] Bounded NBA.com spike ([`SPIKE_NBA_COM.md`](./SPIKE_NBA_COM.md)) — PASS → `nba_com` adapter; FAIL → BALLDONTLIE paid trial/upgrade
- [ ] Record decision in spike results + `BACKEND.md`

### Phase 2 — Vertical slice
- [x] `NbaStatsPort` + Zod boundary (players + nets roster)
- [ ] Pure `scoring/` + unit tests
- [ ] `GET /api/dossier/[id]` + dossier UI in drawer
- [ ] Wire drawer to real role-fit payload

### Phase 3 — Product complete
- [ ] Pillars, callouts, evidence, methodology
- [ ] Loading / empty / error / thin-sample states
- [ ] Responsive polish + demo fixtures

### Phase 4 — Ship
- [ ] Stretch only if ahead (compare / role toggle)
- [ ] Write-up + AI disclosure + final QA + live URL

## Definition of done (per feature)
A feature is done when:
1. Types and boundary validation are correct (no `any` on vendor JSON)
2. Root cause of failures is fixed at the right layer (adapter vs scoring vs UI)
3. Happy path **and** loading / empty / error (or thin-sample) are handled
4. Scoring changes include a unit test when logic is pure
5. Docs/AI log updated if the change affects architecture or used new AI assistance
6. Work was done on a **branch** and merged to `main` only after testing

## Local setup (after Phase 1 scaffold)
```bash
cp .env.example .env.local
# Add BALLDONTLIE_API_KEY from https://balldontlie.io account
npm install   # or pnpm / yarn — lock in Phase 1
npm run dev
```
