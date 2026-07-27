# Phase 1 code review log

Self-review of Phase 1 (`phase-1/scaffold`) before merge. Findings and remediations are tracked here so future debugging can distinguish intentional tradeoffs from leftover debt.

## Severity legend
| Level | Meaning |
|---|---|
| P0 | Accuracy / merge blocker for Phase 1 scope or false foundations for Phase 2 |
| P1 | Quality bar (boundaries, a11y, product correctness) — prefer fix before merge when cheap |
| P2 | Hygiene / maintainability — can defer with an owner |

---

## Pass 1 — 2026-07-26

Initial self-review after Copilot fixes. Remediations shipped in `f199d55` / `4dc17c4`.

### Findings → disposition

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| R1 | P0 | Synthetic negative player ids looked fetchable | **Fixed:** seed/`RosterPlayer.id` is `number \| null`; React keys via `rosterPlayerKey`; never invent negative ids |
| R2 | P0 | Search fired every keystroke → BDL 429 risk | **Fixed:** 280ms debounce + AbortController in `AcquisitionSearch` |
| R3 | P1 | Client cast API JSON without Zod | **Fixed:** `playersApiResponseSchema` / `apiErrorSchema` in `src/lib/api/schemas.ts` |
| R4 | P1 | `excludeNets` only checked `BKN` abbreviation | **Fixed:** also exclude curated seed name keys *(see Pass 2 R14 — aliases incomplete)* |
| R5 | P1 | Drawer lacked Escape / focus restore / trap | **Fixed:** basic dialog keyboard behavior in `NetsHome` |
| R6 | P1 | Muted text contrast on graphite likely below AA | **Fixed:** `--content-muted` mixes dim-grey toward white |
| R7 | P1 | Page vs route used different roster access paths | **Fixed:** shared `loadNetsRoster()` |
| R8 | P2 | `AppError` colocated with player types | **Fixed:** `src/domain/errors.ts` |
| R9 | P2 | Duplicated route error JSON | **Fixed:** `toErrorResponse()` |
| R10 | P2 | Duplicated query length rules | **Fixed:** shared `searchQuerySchema` |
| R11 | P2 | Zod `.passthrough()` retained unknown vendor fields | **Fixed:** strip unknown keys (default) |
| R12 | P2 | Seed could silently duplicate starter slots | **Fixed:** `assertValidNetsSeed` in adapter |
| R13 | P0/P2 | Many seed BDL ids still unresolved | **Partial:** see seed table; Pass 2 updated known ids |

---

## Pass 2 — 2026-07-27 (pre-merge re-review)

Fresh read of current `phase-1/scaffold` (`4dc17c4`), IDENTITY/MVP expectations, lint + production build. Goal: certainty before merge and Phase 2.

### Verification
| Check | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run build` | Pass |
| PR #1 mergeable | Yes |
| Prior Pass 1 fixes still present | Yes (null ids, debounce, Zod client, shared load path, drawer Escape) |
| Identity lock (Nets home, non-Nets search, name cards, drawer placeholder) | Met for Phase 1 scope |

### New findings

| ID | Severity | Finding | Evidence | Disposition |
|---|---|---|---|---|
| R14 | **P1** | **Acquisition filter misses nickname aliases** — seed stores “Nic Claxton” but BDL returns “Nicolas Claxton” (`nicolas\|claxton` ≠ `nic\|claxton`). With BDL team `CHI`, he is **not** excluded and appears as an acquisition candidate. | Live probe 2026-07-27: search `Claxton` → Nicolas Claxton `excluded:false` | **Open — fix before merge** (alias keys and/or known BDL ids in exclude set) |
| R15 | P1 | Client Zod failure treated as empty results | `readPlayers` returns `[]` on parse fail → UI shows “No non-Nets players matched” instead of an error | **Open — prefer fix before merge** (set error state when `!playersApiResponseSchema.success`) |
| R16 | P1 | Drawer focus trap does not cover backdrop; no `inert` on background | Tab cycle only inside `aside`; mouse/screen-reader can still reach page content behind `aria-modal` | **Accepted for Phase 1** — Escape + Close + backdrop click work; harden in Phase 3 polish |
| R17 | P2 | Drawer state drops player identity | `DrawerState` keeps title/subtitle only — Phase 2 dossier fetch has nowhere to hang `id` | **Track for Phase 2** (store `PlayerSummary` / `RosterPlayer`, guard null ids) |
| R18 | P2 | Remaining null seed ids + newly discovered ids not committed | Probe found Ochai Agbaji `38017620` (BKN), Ziaire Williams `17896027` (BDL team LAL) | **Open — cheap to land before merge**; Cam Thomas / Nolan Traore still unresolved |
| R19 | P2 | Duplicate starter slot lists | `STARTER_SLOTS` in seed vs `STARTER_ORDER` in `HalfCourt` | **Defer** — low risk while both are 5 identical slots |
| R20 | P2 | Scaffold clutter | `AGENTS.md`, `CLAUDE.md`, unused `public/*.svg` | **Fixed in cleanup** (removed with vendor-decision PR) |
| R21 | P2 | No unit tests yet | Seed validation / name exclusion / mapping untested | **Defer to Phase 2** (scoring tests first; add adapter smoke tests if time) |
| R22 | — | Hello-world deploy | Still unchecked in `DEVELOPMENT.md` | **Not a code-quality blocker**; do before or early in Phase 2 for demo confidence |

### Seed id status (Pass 2)

| Player | BDL id in repo | Pass 2 note |
|---|---|---|
| Egor Demin | `1057266813` | OK |
| Nolan Traore | `null` | Still unresolved (search hits Armel Traore only) |
| Michael Porter Jr. | `375` | OK |
| Noah Clowney | `56677843` | OK |
| Nic Claxton | `666508` | Id OK; **name alias gap = R14** |
| Cam Thomas | `null` | Still unresolved (`Cam Thomas` search empty/rate-limited in probes) |
| Terance Mann | `666743` | OK |
| Ziaire Williams | `null` | **Probe:** `17896027` — update seed |
| Day'Ron Sharpe | `17896038` | OK |
| Jalen Wilson | `56677722` | OK (BDL team may lag) |
| Ochai Agbaji | `null` | **Probe:** `38017620` (BKN) — update seed |
| Danny Wolf | `1057280779` | OK |
| Drake Powell | `1057279425` | OK |
| Ben Saraf | `1057279760` | OK |

### Architecture / expectation fit (Pass 2)

| Expectation | Status |
|---|---|
| Ports/adapters + Zod at vendor boundary | Good |
| Thin route handlers + typed domain | Good |
| Nets-only home + non-Nets acquisition search | Good except **R14** |
| Verdict-first dossier | Placeholder only — **correct for Phase 1** |
| Loading / empty / error for search | Present; roster SSR error path present |
| Original scoring | Not started — Phase 2 |

---

## Pre-merge recommendation (Pass 2)

**Do not merge until R14 is fixed** — it violates the locked identity rule “search = non-Nets only” for a starter on our curated roster.

**Strongly prefer also before merge:** R15 (honest parse errors), R18 (commit known Agbaji / Ziaire ids).

**Safe to merge with documented debt:** R16, R17, R19–R22.

### Suggested merge gate checklist
- [ ] R14 — exclude by BDL id and/or nickname aliases (`nic`/`nicolas`, etc.)
- [ ] R15 — Zod parse failure → error state, not empty list
- [ ] R18 — write probed ids into `rosterSeed.ts`
- [ ] Re-run `npm run lint` && `npm run build`
- [ ] Smoke: search `Claxton` does **not** list Nicolas; court + drawer + search still work

---

## Deferred (explicitly not blocking after gate)
- Full focus-trap / `inert` backdrop (R16)
- Drawer payload with player id (R17) — Phase 2
- Unit tests (R21)
- Vercel hello deploy (R22)
- Scaffold file cleanup (R20)

## How to use this doc
1. Before blaming UI for wrong search results, check **R14** and the seed table.
2. When Phase 2 dossiers 404, check **null ids** — never call BALLDONTLIE with `null`.
3. Append **Pass 3+** sections rather than rewriting history when re-reviewing.
