# RosterRadar — The Project Narrative

**Live demo:** [https://roster-radar-orcin.vercel.app](https://roster-radar-orcin.vercel.app)  
**Repo:** [Daniel-Mansfield/RosterRadar](https://github.com/Daniel-Mansfield/RosterRadar)  
**Author and Developer:** Daniel Mansfield

---

## 1. Summary

**Roster*Radar*** is a role-aware scouting tool for Brooklyn Nets roster decisions.
It is built for a front-office / scouting-staff mindset: verdict first, evidence second.

It answers:

- *What role does this player play?*
- *How do they grade in that role versus peers?*
- *Is that a Strong / Conditional / Poor fit — with evidence?*

The home page centers the Nets starting five on a half-court. Clicking a court, search, or **On the Radar** card opens the same dossier drawer for evaluation. **Lineup Fit** and one-for-one slot swaps let staff stress-test a hypothetical five without pretending to be a trade engine.

---

## 2. Problem & audience

When developing RosterRadar, I began with an idea to create a web application that grades NBA players on useful metrics and presents them in a stylish, user-friendly way — something that could show where a player can improve. As someone who plays basketball and always wants a competitive edge, that felt like a tool I would actually use.

After more thought and research, I realized NBA front offices evaluate players in **roles**, not as generic box-score piles. Casual players like me might still benefit from a metrics dashboard, but a sharper product emerged: a tool for staff who need a fast, defensible read.

Existing public tools either bury the verdict in tables or lean on proprietary models we cannot ship. RosterRadar uses a calm ops + editorial hybrid. My aim was to combine the seriousness of a platform like *Cleaning the Glass* with the clarity structure of *Leetify* (a Counter-Strike analytics tool). Framing references only — no proprietary formulas copied.

The product job became: *Given Player X, tell me their role, how they grade in it, and whether they’re a strong / conditional / poor roster fit — with evidence.*

---

## 3. Demo walkthrough (~3 minutes)

Try the [live demo](https://roster-radar-orcin.vercel.app) (or local `npm run dev` with a BALLDONTLIE key).

1. **Home** — Confirm brand, search, half-court starters, Lineup Fit, On the Radar, and bench.
2. **Roster dossier** — Click a starter (e.g. Nic Claxton). Confirm role, fit grade + Strong/Conditional/Poor, six peer-percentile pillars, strengths/risks, and evidence. Expand methodology notes.
3. **Acquisition search** — Search a non-Nets name. Open a result → same dossier shape. Optionally use the result swap icon or **Try in lineup**, then click a starter slot; note the Fit banner and Out pin; **Reset**.
4. **Radar + Fit** — Open a Radar card (scouting angle under the subtitle). Change **Sort by** to a pillar and confirm the list reorders. Drag or swap a Radar player onto a starter; confirm Fit deltas; Reset.
5. **Tutorial** — Open Tutorial; step through intro + bullets; Skip or Done. It never auto-blocks the app on load.

---

## Features

### 4. Player dossier

- Map season averages / rates into **six role pillars** (scoring, playmaking, rebounding, spacing, disruption, workload) as **peer percentiles**.
- Infer a **role label** from pillar pattern (rule-based).
- **Fit grade** from role-weighted pillars; recommendation Strong / Conditional / Poor with text verdict.
- **Thin sample** (low games) lowers confidence and can cap Strong → Conditional.
- Callouts: up to two strengths + two risks from thresholds; evidence strip contrasts L10 vs season where available.

**Example read:** A paint-leaning big with elite rebounding / disruption and near-floor spacing tends toward a paint / rim role, not a primary creator — even if assist rank looks incidental. The dossier surfaces that as a Conditional (or Poor) creator-style fit when the role weights ask for creation and spacing the tape doesn’t support. The grade stays honest; thin samples cannot paper over gaps by claiming Strong.

Version string on payloads (`scoringVersion`) keeps UI and write-up aligned. Details and limits are in methodology notes on each dossier and in [`BACKEND.md`](./BACKEND.md).

### 5. On the Radar

- Full curated pool in a vertical scroll; Shuffle redraws the list.
- Staff can sort the current cards by any Fit pillar (defaults to the real five’s primary need) via season-line RR percentiles (`GET /api/radar-scores`) — not a league-wide attribute search. Changing the pillar reorders immediately.

### 6. Swap simulation

- Client-side: one incoming player replaces one starter by slot (acquisition from Radar or player search, or bench true-exchange).
- Fit refetch for the hypothetical five; deltas vs the real five’s baseline Fit.
- Acquisition swaps pin displaced real starters on the bench (Out); further slot changes accumulate; Out pins can return; bench swaps exchange spots; Reset clears the board.
- Search: swap icon on results or **Try in lineup** in the dossier; same Fit path as Radar.
- No salary, multi-player packages, or chemistry claims.

### 7. Lineup Fit

- Team pillar = unweighted mean of starters’ pillar percentiles.
- Lineup grade = mean of the six team pillars.
- Callouts at ≥70th (strength) / ≤45th (gap), max two of each; soft pad to three when sparse; fully balanced stays empty.
- Thin-sample starter caps lineup recommendation at Conditional.
- Explicitly **not** synergy, lineup +/-, or scheme modeling (`rr-lineup-fit-v1`).

---

## 8. Architecture

```
Browser (Next.js)
  → Route Handlers (/api/players, /api/dossier/[id], /api/team-fit, /api/radar-scores)
    → NbaStatsPort (BALLDONTLIE adapter)
    → pure scoring/ (composeDossier, composeTeamFit) + radar gap helpers
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

## 9. Data vendor

**BALLDONTLIE GOAT** behind `NbaStatsPort`. An NBA.com spike failed from Vercel (IP / bot blocks); BALLDONTLIE is cloud-callable and sufficient for season averages + game logs. The demo window uses a **paid GOAT month**; fixtures remain the documented offline fallback. Headshots use curated ESPN athlete ids (Nets seed + Radar pool) plus best-effort ESPN search for acquisition results — not BDL. Decision record: [`VENDOR_DECISION.md`](./VENDOR_DECISION.md).

---

## 10. Design and identity docs

Design system: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)  
Identity: [`IDENTITY.md`](./IDENTITY.md)

---

## 11. Tech choices

| Choice | Why |
|---|---|
| TypeScript + Next.js App Router | Typed end-to-end; Route Handlers for thin API; Vercel deploy |
| Pure `scoring/` | Testable without network; original formulas owned in-repo |
| Zod at boundaries | Fail loud on bad vendor/HTTP shapes |
| HTML5 DnD (no library) | Scoped swap; less dependency surface |
| CSS modules + semantic tokens | One accent; fit colors only for status |

---

## 12. Limits & honesty

- **BALLDONTLIE** only provides roster information up to the previous NBA season.
- Public counting stats only — no tracking, film, or contested-shot models.
- Percentiles are relative to the loaded peer pool for the season, not a proprietary FO database.
- Lineup Fit and swaps are **aggregation**, not on-court projection.
- Search combobox full ARIA (arrow keys / `aria-activedescendant`) deferred; Tab/Enter work.
- Rate limits possible; cache + clear `rate_limited` messaging mitigate GOAT usage.
- Expense of **BALLDONTLIE** GOAT API usage is $40/month.

---

## 13. AI disclosure

**Concept, scoring model, and product judgment are original.**

Cursor (Composer / agent) assisted with planning, documentation, scaffolding, refactors, and implementation under project rules (root-cause-first, ports/adapters, UI/UX tokens).

AI did **not** invent the project thesis or the Fit / Lineup aggregation semantics. Phase-by-phase log: [`AI_USAGE.md`](./AI_USAGE.md).

---

## 14. Final QA checklist

See [`FINAL_QA.md`](./FINAL_QA.md).

---

## 15. Reflections & next steps

**Tradeoff I chose on purpose**

- Lineup Fit and swaps stay **peer-percentile aggregation**, not synergy or +/- projection — honest enough for FO stress-testing, without overclaiming chemistry.
- **On the Radar** is a curated shortlist with pillar sort, not a league-wide attribute search — scoped for demo rate limits and a clear scouting narrative.

**If I had another week**

- Enhanced search for users who want the most compatible players based on the qualities we grade
- Full ARIA combobox for acquisition search (arrow keys / `aria-activedescendant`)
- Richer peer-pool honesty (document pool size drift; optional season picker)
- Touch-friendlier swap targets and a clearer tablet mid-layout between phone stack and desktop rails

---

## References

- [`PROJECT_OUTLINE.md`](./PROJECT_OUTLINE.md), [`BACKEND.md`](./BACKEND.md), [`VENDOR_DECISION.md`](./VENDOR_DECISION.md), [`AI_USAGE.md`](./AI_USAGE.md)
- Framing only: [Cleaning the Glass](https://cleaningtheglass.com/about/), [BBall Index](https://www.bball-index.com/), [Leetify](https://leetify.com/), [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- Data: [BALLDONTLIE](https://docs.balldontlie.io/)
