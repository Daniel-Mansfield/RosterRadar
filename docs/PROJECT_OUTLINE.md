# RosterRadar — Project Outline

**One-sentence thesis:** RosterRadar is a role-aware scouting dossier that helps NBA decision-makers judge a player’s roster fit in under a minute — verdict first, evidence second.

**Repo description:** Scouting dossiers that grade NBA players by role, not just box scores.

---

## 1. Assignment alignment

Source: project brief provided by Daniel (NBA web app assignment).

| Guideline | How RosterRadar satisfies it |
|---|---|
| NBA basketball data; any API | Fetch player + season/game stats from a chosen public API |
| Clear backend/API ↔ frontend | Backend computes role, percentiles, fit grade, callouts; frontend renders dossier |
| Opinionated, easy-to-use frontend | Verdict-first dossier; limited pillars; plain-language strengths/risks |
| Useful to NBA team decision-makers | Framed as role-fit scouting for FO/staff, not a fan box-score browser |
| GitHub repo + live deploy + write-up | Explicit deliverables |
| Small scope / 10 days | MVP = search → one-player dossier (± compare stretch) |
| JS/TS valued; clean/maintainable code | TypeScript end-to-end |
| AI allowed with disclosure; concept original | Own problem statement + scoring; disclose AI use in write-up |

---

## 2. Product definition

### 2.1 What we’re building
A **Brooklyn Nets–anchored** scouting experience:

1. Home = Nets roster on a half-court (portrait cards; curated Nets headshots) + bench list
2. Click a Nets player → right drawer = **role-fit dossier**
3. Search **non-Nets** players → same drawer dossier (acquisition candidates)
4. Dossier: role, fit grade, recommendation, pillars, strengths/risks, evidence

Identity detail: [`IDENTITY.md`](./IDENTITY.md). Visual tokens: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

### 2.2 Non-goals (v1)
Auth, multi-team picker, film, tracking, salary/cap, **full** multi-player DnD trade packages, team +/- / synergy projections, **full** headshot pipeline for arbitrary search results (Nets use curated ESPN ids only — see IDENTITY), social, live in-game tools.

**In scope (narrow):** one-for-one client-side Radar → starter swap that recomputes Lineup Fit peer aggregation and shows deltas — not a trade engine.

### 2.3 Inspiration & domain references (framing only — do not copy proprietary models)

| Idea | Source |
|---|---|
| Decision-maker / “basketball decisions” framing | [Cleaning the Glass — About](https://cleaningtheglass.com/about/) (Ben Falk; former NBA FO) |
| Percentiles vs peers for interpretability | [Cleaning the Glass — Stats intro](https://cleaningtheglass.com/stats/) |
| Modern position/role groupings | [CTG position groupings](https://cleaningtheglass.com/stats/guide/player_positions) |
| Skill/role grades beyond raw box scores | [BBall Index — Offensive Talent Grades](https://www.bball-index.com/explaining-offensive-talent-grades/) |
| Role/archetype matters in evaluation | [BBall Index — Offensive Roles](https://www.bball-index.com/offensive-archetypes/) |
| Talent vs impact / context awareness | [BBall Index — Talent vs Impact](https://www.bball-index.com/talent-vs-impact-stats/) |
| Verdict → sub-scores → callouts UX | [Leetify](https://leetify.com/) (UX pattern; adapt for staff) |
| Grade-then-why presentation | [PFF](https://www.pff.com/), [PlayerProfiler](https://www.playerprofiler.com/) |
| Progressive disclosure; minimal first screen | [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) |

CTG/BBall Index inform **philosophy and UX**, not data or proprietary formulas. Scoring must be **simpler, documented, and original**, built on public API fields.

---

## 3. Primary user & job-to-be-done

**Primary user:** NBA team decision-maker analogue (FO analyst / scouting staff mindset).

**Job-to-be-done:**  
“Given Player X, tell me what role they play, how they grade in that role, and whether they’re a strong / conditional / poor roster fit — with evidence.”

**Demo success:** Open app → Nets court visible → open a dossier (roster click or non-Nets search) with recommendation in the drawer without hunting through tables.

---

## 4. MVP features

### Must-have
1. **Nets home** — half-court starters + bench; portrait cards with curated headshots (initials fallback); brand wordmark
2. **Dossier drawer** — role, fit grade, verdict, Strong/Conditional/Poor, confidence
3. **Role pillars (4–6)** — peer percentiles
4. **Callouts** — 2 strengths + 2 risks
5. **Evidence strip** — L10 vs season / key supporting stats
6. **Non-Nets player search** — results open dossier in drawer (no trade execute)
7. **Methodology** + loading/empty/error/thin-sample states

### Stretch (only if ahead)
8. Compare two players on same role axes
9. “Evaluate as” role toggle

---

## 5. UX / visual language

### Information architecture
```
Home (Search)
  └─ Dossier
       ├─ Hero verdict (always visible)
       ├─ Pillars
       ├─ Strengths | Risks
       ├─ Evidence
       └─ Methodology (collapsed)
```

### Rules
- Verdict first, details later (progressive disclosure)
- One accent color; green/amber/red only for fit signals
- Shared percentile bar component everywhere
- Calm “ops + editorial” hybrid: CTG seriousness + Leetify clarity structure
- Sticky mini-header on scroll (optional polish): Name · Role · Fit grade

---

## 6. Scoring model (keep simple for 10 days)

### Roles (v1 — reduce as needed)
- Primary creator
- Secondary creator / combo
- 3-and-D wing
- Stretch forward
- Rim-running / roll big
- Anchor / rim-protection big

**Detection:** rule-based or lightweight scoring from public stats (usage, AST%, 3PA rate, REB%, BLK%, etc.). Document fully in write-up.

### Pillars
Each role has 4–6 weighted metrics. Example (3-and-D wing): spot-up/3PT efficiency, usage discipline, defensive stock proxy, finishing/FT rate, playmaking support.

### Fit grade
Weighted blend of role-pillar percentiles → score → Strong / Conditional / Poor thresholds.

### Transparency
Write-up must state inputs, peer group definition, and public-data limitations (especially defense).

---

## 7. Technical architecture

**Detail + citations:** [`docs/BACKEND.md`](./BACKEND.md) · Cursor rule: `.cursor/rules/backend.mdc`

### Backend philosophy (locked)
- **Backend owns interpretation; frontend owns presentation.**
- Light **ports & adapters** (Cockburn): NBA vendor and HTTP are adapters; scoring is the pure core.
- **Zod at trust boundaries** (HTTP in, vendor JSON, env); allow-list validation on the server ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)).
- **Next.js Route Handlers** for `GET /api/players` and `GET /api/dossier/[playerId]` ([Next.js docs](https://nextjs.org/docs/app/getting-started/route-handlers)).
- Deterministic, templated callouts — no LLM in the scoring path for MVP.
- No auth, no write DB, no separate API server in v1.

### Default stack
- TypeScript + Next.js (App Router)
- Route Handlers + `nba/` adapter + `scoring/` pure module
- Lightweight charts (e.g. Recharts)
- Deploy: Vercel (or similar)

### Data flow
```
Client (Search/Dossier UI)
  → Route Handler (validate query)
      → NbaStatsPort adapter (fetch + Zod → domain)
      → Pure scoring (role, percentiles, fit, callouts)
  ← Typed Dossier JSON (+ explicit error codes)
Client renders opinionated UI
```

### Data source (locked)
**BALLDONTLIE NBA API** — [docs](https://docs.balldontlie.io/). API key via `BALLDONTLIE_API_KEY`. Adapter: `NbaStatsPort`.

**Decision record:** [`VENDOR_DECISION.md`](./VENDOR_DECISION.md) (why not NBA.com on Vercel; GOAT trial for Phase 2; seed fallback).

| Option | Status |
|---|---|
| BALLDONTLIE (chosen) | Cloud-friendly REST + key; GOAT for roster/stats during Phase 2 |
| NBA.com `stats.nba.com` | Richer locally; **rejected** as Vercel runtime primary |
| Fixtures snapshot | Backup if trial ends without paid tier |

---

## 8. 10-day plan

| Day | Focus | Outcome |
|---|---|---|
| 1 | Repo setup, deploy skeleton, API spike | Live skeleton + confirmed data access |
| 2 | Data model + normalize | Stable backend types |
| 3 | Role detection + peer percentiles | Scoring + tests |
| 4 | Fit grade + callout generator | Dossier JSON complete |
| 5 | Search UI + dossier hero | Verdict visible |
| 6 | Pillars + callouts + evidence UI | Core UX complete |
| 7 | Visual polish + empty/error/loading | Opinionated visual language |
| 8 | Edge cases, sample players, perf | Demo-ready |
| 9 | Stretch compare *or* harden; start write-up | Buffer |
| 10 | Write-up, AI disclosure, final QA | Submit package |

---

## 9. Deliverables

1. GitHub repository (this repo)
2. Live deployment (public URL)
3. Write-up: summary, architecture, tech choices, scoring methodology + limits, AI disclosure, references

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| API flaky / rate-limited | Adapter + cache; seed demo players |
| Role model feels naive | Few roles; document clearly; confidence badges |
| Scope creep | Enforce non-goals list |
| Looks like generic stats site | Non-negotiable hero verdict + callouts |
| Originality concern | Own thesis + scoring; cite inspirations |

---

## 11. Bibliography

**Assignment**
- Daniel’s project guidelines (NBA data, FO utility, small scope, deploy, write-up, TS/JS, AI disclosure)

**Basketball analytics / product**
- Cleaning the Glass — [home](https://cleaningtheglass.com/), [about](https://cleaningtheglass.com/about/), [stats](https://cleaningtheglass.com/stats/), [position groupings](https://cleaningtheglass.com/stats/guide/player_positions)
- BBall Index — [talent grades](https://www.bball-index.com/explaining-offensive-talent-grades/), [offensive roles](https://www.bball-index.com/offensive-archetypes/), [talent vs impact](https://www.bball-index.com/talent-vs-impact-stats/)

**UX**
- NN/g — [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- Leetify — [leetify.com](https://leetify.com/) (interaction pattern inspiration only)
- Design system detail: [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)

**Backend / architecture**
- Alistair Cockburn — [Hexagonal Architecture (Ports & Adapters)](https://alistair.cockburn.us/hexagonal-architecture/)
- Next.js — [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Caching](https://nextjs.org/docs/app/guides/caching-without-cache-components)
- OWASP — [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [Proactive Control C3](https://top10proactive.owasp.org/archive/2024/the-top-10/c3-validate-input-and-handle-exceptions/)
- Backend detail: [`docs/BACKEND.md`](./BACKEND.md)

**Working decisions**
- Name: **RosterRadar**
- Concept: role-fit scouting dossier for decision-makers
- UX: Leetify-like clarity + CTG-like seriousness
- Backend: ports/adapters + pure scoring + Zod at boundaries
- Data vendor: **BALLDONTLIE** (`NbaStatsPort` adapter; note API tier limits)
- Scope: small 10-day MVP
- Process: [`docs/DEVELOPMENT.md`](./DEVELOPMENT.md) · AI log: [`docs/AI_USAGE.md`](./AI_USAGE.md)
