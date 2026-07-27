# Phase 2 review debt

Standards QA against `docs/BACKEND.md`, `.cursor/rules/typescript-react.mdc`, and `.cursor/rules/backend.mdc` after the dossier slice landed.

## Fixed in this pass

| ID | Issue | Fix |
|---|---|---|
| P2-1 | Adapter imported `parseMinutes` from `scoring/` (layering) | Moved to `src/nba/parseMinutes.ts`; scoring stays pure / I/O-free |
| P2-2 | 429 surfaced as vague `upstream` 503 | New `rate_limited` code + HTTP 429 + trial-aware message |
| P2-3 | Thin sample only implied by `confidence.level` | Explicit `confidence.thinSample` (domain + Zod + UI) |
| P2-4 | Lookup maps typed with `Record` only | Prefer `satisfies Record<…>` for role/pillar/fit labels |

## Residual / later

| ID | Issue | Notes |
|---|---|---|
| P2-5 | Response caching | **Fixed:** TTL + singleflight on port + composed dossier (~10 min) |
| P2-6 | Prior-season fallback doubles vendor calls | Mitigated by caching null/season/game keys; still 2–3 calls on first miss |
| P2-7 | `NetsHome` owns drawer fetch + a11y | Extract `useDossierDrawer` when UI pass starts |
| P2-8 | Adapter `?? 0` on optional box fields | Prefer explicit nulls if BDL starts omitting fields; ranks already nullable |
| P2-9 | Full dialog `inert` / focus trap polish | Carried from Phase 1 R16 |
| P2-10 | Null seed ids (some Nets) | Acquisition path OK; roster click still unavailable without id |

## Cache QA pass (2026-07-27)

| ID | Issue | Fix |
|---|---|---|
| P2-11 | Separate dossier + port caches (two budgets) | Shared `getNbaResponseCache()` store, one LRU `maxEntries` |
| P2-12 | Search keys used raw query (case/whitespace drift) | Key + load via `searchQuerySchema` normalized string |
| P2-13 | Eviction was insert-order FIFO, hot keys vulnerable | LRU touch on `get`; re-insert on `set` |
| P2-14 | `perPage` default 25 vs dossier 30 (duplicate keys) | Align default to **30** across port/adapter/dossier |
| P2-15 | Thin cache tests | Expiry, LRU eviction, cachedPort normalize/null tests |
| P2-16 | `resetNbaStatsPortForTests` left dossier entries | Reset clears shared store |

**Accepted (no change):** process-local only on Vercel; cached object references are read-only by contract (no `structuredClone` on every hit — would add cost for little gain while UI does not mutate).

## UI QA pass (2026-07-27)

| ID | Issue | Fix |
|---|---|---|
| P2-17 | Raw `#000` in component CSS (token rule) | `--scrim` / `--logo-plate` semantic tokens |
| P2-18 | Evidence header `aria-hidden` hid column context | Real `<table>` with `scope` for L10 vs season |
| P2-19 | Fit class via loose `styles[key]` index | `FIT_CLASS` map + `requireClass` for CSS-module strict types |
| P2-20 | Non-standard `font-weight: 550/650` | Use `500` / `600` |
| P2-21 | Grade numeral color-only for SR | Scoreboard `aria-label` with fit + grade; numeral `aria-hidden` |

## Card / headshot review (2026-07-27)

| ID | Issue | Fix |
|---|---|---|
| P2-22 | Avatar `failed` stuck across player changes | Reset on `espnAthleteId` / name change |
| P2-23 | Landscape card not image-forward | Portrait playing-card aspect `2.5 / 3.5` |
| P2-24 | Dossier had no photo path | Pass curated `espnAthleteId` via drawer → hero portrait |
| P2-25 | Title-split for avatar names (Jr.) | Store `firstName` / `lastName` on drawer state |

## Card follow-up review (2026-07-27)

| ID | Issue | Fix |
|---|---|---|
| P2-26 | Repeated drawer `setDrawer` identity blobs | `DrawerIdentity` + `showDrawer()` helper |
| P2-27 | Unused `idle` dossier load status | Removed from union |
| P2-28 | Invalid/zero ESPN ids could still request CDN | `isEspnAthleteId` guard + URL throw + seed validation |
| P2-29 | Hover lift ignored `prefers-reduced-motion` | Disable transform under reduced motion |
| P2-30 | Background scroll under open drawer | Lock `document.body.style.overflow` while open |
| P2-31 | Name clamp only `-webkit-line-clamp` | Also set standard `line-clamp` |

## Home layout review (2026-07-27)

| ID | Issue | Fix |
|---|---|---|
| P2-32 | Hardcoded `#001c42` in court CSS | Brand token `--court-matte` |
| P2-33 | `.main > :first-child` grid placement fragile | Named `.courtPane` wrapper |
| P2-34 | `PlayerCard` CSS `.bench` collided with section name | Renamed modifier to `.sizeBench` |

**Still deferred:** P2-7 full `useDossierDrawer` extract; P2-9 dialog `inert`; P2-10 null BDL seed ids; court PNG license is third-party (Signs by SI) — keep attribution in IDENTITY.

## Checklist (standards)

- [x] Zod at vendor + HTTP boundaries; client re-validates dossier JSON
- [x] Scoring pure (no fetch/env); unit tests under `npm test`
- [x] Discriminated unions for drawer / dossier load state
- [x] Typed `AppError` codes; no silent swallow of Zod failures
- [x] Route handlers thin; compose in `loadDossier` + scoring
- [x] Cache layer (TTL read-through + singleflight; see BACKEND §6)
- [x] UI polish pass (header/dossier Leetify structure + responsive search)
- [x] UI QA pass (tokens, evidence table a11y, fit class typing)
