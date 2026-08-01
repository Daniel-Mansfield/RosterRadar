# RosterRadar — Assignment write-up

**Live demo:** [https://roster-radar-orcin.vercel.app](https://roster-radar-orcin.vercel.app)  
**Repo:** [Daniel-Mansfield/RosterRadar](https://github.com/Daniel-Mansfield/RosterRadar)  
**Author:** Daniel Mansfield  

This document is the submission write-up. Detailed design notes live in sibling docs; this page is the narrative graders can read end-to-end.

---

## 1. Summary

**RosterRadar** is a role-aware scouting tool for Brooklyn Nets roster decisions. It answers: *what role does this player play, how do they grade in that role versus peers, and is that a Strong / Conditional / Poor fit — with evidence?*

The home surface shows the Nets starting five on a half-court plus bench depth, a **Lineup Fit** rail (peer-percentile aggregation for the five), and **On the Radar** (curated acquisition shortlist). Search opens dossiers for non-Nets players. An optional **Tutorial** coach-marks the live UI. A scoped **one-for-one swap** lets staff drag (or use a swap icon) a Radar candidate or bench player onto a starter and see Lineup Fit deltas — peer aggregation only, not a trade engine.

---

## 2. Problem & audience

NBA front offices evaluate players in **roles**, not as generic box-score piles. Existing public tools either bury the verdict in tables or lean on proprietary models we cannot ship. RosterRadar targets an FO / scouting-staff mindset: verdict first, evidence second, progressive disclosure, calm ops + editorial hybrid (CTG seriousness + Leetify clarity structure). Framing references only — no proprietary formulas copied.

Primary job-to-be-done: *Given Player X, tell me their role, how they grade in it, and whether they’re a strong / conditional / poor roster fit — with evidence.*

---

## 3. Architecture

```
Browser (Next.js)
  → Route Handlers (/api/players, /api/dossier/[id], /api/team-fit)
    → NbaStatsPort (BALLDONTLIE adapter)
    → pure scoring/ (composeDossier, composeTeamFit)
  ← typed JSON (Zod at boundaries)
```

| Layer | Responsibility |
|---|---|
| `src/nba/` | Vendor adapter; normalizes snake_case → domain |
| `src/scoring/` | Pure role / pillars / fit / lineup aggregation + tests |
| `src/domain/` | Shared types (`Dossier`, `TeamFit`, lineup sim) |
| `src/app/api/` | Thin handlers; Zod request/response |
| `src/components/` | Home, dossier drawer, Fit, Radar, Tour |

**Principles:** ports/adapters; no `any` on vendor JSON; root-cause fixes (not symptom patches); process-local TTL cache for demo rate limits. Full backend notes: [`BACKEND.md`](./BACKEND.md).

---

## 4. Data vendor

**BALLDONTLIE GOAT** behind `NbaStatsPort`. An NBA.com spike failed from Vercel (IP / bot blocks); BALLDONTLIE is cloud-callable and sufficient for season averages + game logs. The demo window uses a **paid GOAT month**; fixtures remain the documented offline fallback. Headshots use curated ESPN athlete ids (Nets seed + Radar pool) plus best-effort ESPN search for acquisition results — not BDL. Decision record: [`VENDOR_DECISION.md`](./VENDOR_DECISION.md).

---

## 5. Scoring methodology (original)

### Player dossier
- Map season averages / rates into **six role pillars** (scoring, playmaking, rebounding, spacing, disruption, workload) as **peer percentiles**.
- Infer a **role label** from pillar pattern (rule-based).
- **Fit grade** from role-weighted pillars; recommendation Strong / Conditional / Poor with text verdict.
- **Thin sample** (low games) lowers confidence and can cap Strong → Conditional.
- Callouts: up to two strengths + two risks from thresholds; evidence strip contrasts L10 vs season where available.

Version string on payloads (`scoringVersion`) keeps UI and write-up aligned. Details and limits are in methodology notes on each dossier and in [`BACKEND.md`](./BACKEND.md).

### Lineup Fit
- Team pillar = unweighted mean of starters’ pillar percentiles.
- Lineup grade = mean of the six team pillars.
- Callouts at ≥70th (strength) / ≤45th (gap), max two of each; soft pad to three when sparse; fully balanced stays empty.
- Thin-sample starter caps lineup recommendation at Conditional.
- Explicitly **not** synergy, lineup +/-, or scheme modeling (`rr-lineup-fit-v1`).

### Swap simulation
- Client-side: one incoming player replaces one starter by slot (acquisition from Radar or player search, or bench true-exchange).
- Fit refetch for the hypothetical five; deltas vs the real five’s baseline Fit.
- Acquisition swaps pin the displaced starter on the bench (Out); bench swaps exchange spots.
- Search: swap icon on results or **Try in lineup** in the dossier; same Fit path as Radar.
- No salary, multi-player packages, or chemistry claims.

---

## 6. Product surface (shipped)

1. **Nets home** — half-court + bench; portrait cards  
2. **Dossier drawer** — search or click → role, grade, pillars, callouts, evidence  
3. **On the Radar** — curated shortlist, shuffle, zero API until dossier open  
4. **Lineup Fit** — starting-five aggregation + methodology disclosure  
5. **Lineup swap** — Radar, search, or bench → starter via DnD / swap icon / Try in lineup; Fit banner + Reset  
6. **Tutorial** — optional spotlight coach marks (never auto-blocking)  
7. **States** — loading skeletons, errors/retry, thin-sample, unavailable ids  

Design system: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md). Identity: [`IDENTITY.md`](./IDENTITY.md).

---

## 7. Tech choices

| Choice | Why |
|---|---|
| TypeScript + Next.js App Router | Typed end-to-end; Route Handlers for thin API; Vercel deploy |
| Pure `scoring/` | Testable without network; original formulas owned in-repo |
| Zod at boundaries | Fail loud on bad vendor/HTTP shapes |
| HTML5 DnD (no library) | Scoped swap; less dependency surface |
| CSS modules + semantic tokens | One accent; fit colors only for status |

---

## 8. Limits & honesty

- Public counting stats only — no tracking, film, or contested-shot models.  
- Percentiles are relative to the loaded peer pool for the season, not a proprietary FO database.  
- Lineup Fit and swaps are **aggregation**, not on-court projection.  
- Search combobox full ARIA (arrow keys / `aria-activedescendant`) deferred; Tab/Enter work.  
- Rate limits possible; cache + clear `rate_limited` messaging mitigate GOAT usage.

---

## 9. AI disclosure

**Concept, scoring model, and product judgment are original.** Cursor (Composer / agent) assisted with planning, documentation, scaffolding, refactors, and implementation under project rules (root-cause-first, ports/adapters, UI/UX tokens). AI did **not** invent the FO scouting thesis or the Fit/Lineup aggregation semantics (those were human-approved). Phase-by-phase log: [`AI_USAGE.md`](./AI_USAGE.md).

---

## 10. Final QA checklist

See [`FINAL_QA.md`](./FINAL_QA.md). Smoke on production after Phase 3 wrap merges: home, dossier (roster + search + Radar angle), Lineup Fit, Radar/bench swap + Reset, Tutorial, mobile stack, thin-sample / error paths.

---

## References

- Project brief (Daniel) — NBA web app assignment constraints  
- [`PROJECT_OUTLINE.md`](./PROJECT_OUTLINE.md), [`BACKEND.md`](./BACKEND.md), [`VENDOR_DECISION.md`](./VENDOR_DECISION.md), [`AI_USAGE.md`](./AI_USAGE.md)  
- Framing only: [Cleaning the Glass](https://cleaningtheglass.com/about/), [BBall Index](https://www.bball-index.com/), [Leetify](https://leetify.com/), [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)  
- Data: [BALLDONTLIE](https://docs.balldontlie.io/)
