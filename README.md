# RosterRadar

**Role-aware NBA scouting dossiers** — grade players by the job they play, not a flat box-score dump.

Built for a Brooklyn Nets front-office mindset: verdict first, evidence second. Open a starter or search an acquisition target, get a role label, peer-percentile pillars, and a Strong / Conditional / Poor fit read you can defend.

**Live demo:** [roster-radar-orcin.vercel.app](https://roster-radar-orcin.vercel.app)

---

## What you can do

- Inspect the Nets **starting five** on a half-court, with bench depth beside it
- Open a **dossier drawer** — role, fit grade, six pillars, strengths/risks, L10 vs season evidence
- **Search** non-Nets players and evaluate them on the same dossier surface
- Read **Lineup Fit** — peer-percentile aggregation for the five on the floor
- Browse **On the Radar** — curated acquisition shortlist with Shuffle and pillar sort
- **Simulate one-for-one swaps** (Radar, search, or bench → a starter slot) and see Fit deltas
- Walk the UI with an optional **Tutorial**

Assignment write-up (methodology, architecture, AI disclosure): [`docs/WRITEUP.md`](docs/WRITEUP.md)

---

## Stack

TypeScript · React · Next.js (App Router) · Zod · BALLDONTLIE · Vercel

Ports/adapters for NBA data (`src/nba/`), pure scoring (`src/scoring/`), thin Route Handlers, CSS modules + semantic tokens.

---

## Run locally

```bash
cp .env.example .env.local
# Add BALLDONTLIE_API_KEY from https://balldontlie.io
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Never commit secrets. On Vercel, set `BALLDONTLIE_API_KEY` for Production and Preview.

---

## Verify

```bash
npm test          # unit tests (scoring, lineup sim, cache, …)
npm run lint      # ESLint
npx tsc --noEmit  # types
npm run build     # production build
```

---

## Docs

Full reading order and product map: [`docs/README.md`](docs/README.md)

| Doc | Role |
|---|---|
| [`docs/WRITEUP.md`](docs/WRITEUP.md) | Submission narrative |
| [`docs/IDENTITY.md`](docs/IDENTITY.md) | Product locks |
| [`docs/BACKEND.md`](docs/BACKEND.md) | Architecture + API contracts |
| [`docs/AI_USAGE.md`](docs/AI_USAGE.md) | AI disclosure log |

AI assisted implementation under project rules; **concept and scoring judgment are original** — see the write-up and AI log.
