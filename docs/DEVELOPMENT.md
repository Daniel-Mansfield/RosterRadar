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
- [x] Hello-world deploy (Vercel — see vendor section)
- [x] `.env.local` from `.env.example` (local only; never commit)

### Vendor decision (before Phase 2 scoring)
- [x] Research + lock ([`VENDOR_DECISION.md`](./VENDOR_DECISION.md)) — BALLDONTLIE GOAT trial; NBA.com not used on Vercel
- [x] Confirm GOAT endpoints with rotated API key (`npm run verify:goat` — search, active players, season averages, game stats all PASS; pace ≤5 req/min on trial)
- [ ] **Decide post-trial path before GOAT ends** — paid month vs demo fixtures (still open; blocks long-lived demos when trial expires)

### Phase 2 — Vertical slice
- [x] `NbaStatsPort` + Zod boundary (players + nets roster)
- [x] GOAT verify (`npm run verify:goat`)
- [x] Pure `scoring/` + unit tests (`npm test`)
- [x] `GET /api/dossier/[id]` + dossier UI in drawer
- [x] Wire drawer to real role-fit payload (acquisition path first; Nets with resolved ids)
- [x] Phase 2 merged to `main` (PR #3) — review log: [`PHASE_2_REVIEW.md`](./PHASE_2_REVIEW.md)
- [x] Vercel preview/production have `BALLDONTLIE_API_KEY` (set post-merge when dossier opened blank)

### Phase 3 — Product complete (harden what shipped)
Much of the dossier UI already landed in Phase 2. Phase 3 is completion/polish, not a greenfield rebuild:
- [x] Pillars, callouts, evidence, methodology (shipped in dossier panel)
- [x] Loading / error / thin-sample surfaces (drawer + dossier confidence)
- [ ] Empty / edge-case polish (null seed ids, rate-limit UX under trial, search empty states)
- [ ] Responsive polish pass + **demo fixtures** (or paid tier) for reliable demos
- [ ] Close residual debt as needed: P2-7 drawer hook, P2-9 `inert`, P2-10 null BDL ids ([`PHASE_2_REVIEW.md`](./PHASE_2_REVIEW.md))

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
