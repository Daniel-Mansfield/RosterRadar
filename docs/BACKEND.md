# RosterRadar — Backend Design

**Philosophy:** The backend owns interpretation; the frontend owns presentation. External NBA data is compiled into one typed **dossier** — role, fit grade, pillars, strengths/risks, evidence — so the UI mostly renders, not recalculates.

Full product scope: [`PROJECT_OUTLINE.md`](./PROJECT_OUTLINE.md).

---

## 1. Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Shape | **Ports & adapters** (hexagonal, light) | Core scoring stays independent of vendor APIs and HTTP |
| Runtime | **Next.js App Router Route Handlers** | Official TS path; clear API → frontend; one deploy |
| Domain | **Our types only** (`Player`, `Role`, `Dossier`, …) | Vendor JSON never leaks into UI or scoring |
| Validation | **Zod at trust boundaries** | TS erases at runtime; validate unknown ingress once |
| Scoring | **Pure functions, no I/O** | Unit-testable; same inputs → same grades |
| API surface | **Thin GET resources** | Search + dossier; compare is stretch |
| Persistence | **None for v1** | Read-through cache only; no DB |
| Auth | **None for v1** | Assignment non-goal |
| Data vendor | **BALLDONTLIE NBA API** (primary) | GOAT trial for Phase 2; NBA.com rejected for Vercel runtime — [`VENDOR_DECISION.md`](./VENDOR_DECISION.md) |

---

## 2. Architecture (ports & adapters)

Inspired by Alistair Cockburn’s **Ports and Adapters** (hexagonal architecture): keep the application core free of UI and infrastructure details so adapters (NBA API, HTTP) can change without rewriting business logic.

```
┌──────────────────────────────────────────────────┐
│  Driving adapter: Route Handlers (HTTP)          │
│    /api/players · /api/dossier/[id] · /api/team-fit │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│  Application core                                │
│    composeDossier() · composeTeamFit() · search  │
│    scoring/*  (pure)                             │
└─────────────────────┬────────────────────────────┘
                      │  port: NbaStatsPort
┌─────────────────────▼────────────────────────────┐
│  Driven adapter: NBA API client                  │
│    fetch → Zod parse → domain types              │
└──────────────────────────────────────────────────┘
```

| Layer | Owns | Must not |
|---|---|---|
| **Adapter (NBA)** | HTTP to vendor, normalize, boundary Zod schemas | Fit grades, callout copy, React |
| **Scoring (core)** | Role detect, peer percentiles, fit, templated callouts | `fetch`, cache, env, UI |
| **Application** | Orchestrate port + scoring into `Dossier` | Inline formulas; vendor field names |
| **Route Handlers** | HTTP status, query validation, JSON envelope | Business math |

---

## 3. Module layout (target)

```
src/
  domain/           # shared types (Player, Role, Dossier) + AppError
  nba/              # NbaStatsPort + vendor adapter(s) + Zod schemas
  scoring/          # pure: roles, percentiles, fit, callouts
  app/
    api/
      players/route.ts
      dossier/[playerId]/route.ts
```

Names can adjust when scaffolding; the **boundaries** must not.

---

## 4. API contract (v1)

### `GET /api/players?q=`
- Input: search string (server-validated; min length, max length)
- Output: `{ players: PlayerSummary[] }`
- Multi-word queries: BDL `search` is single-field, so the adapter plans a vendor token + local first/last prefixes (`playerSearchQuery.ts`) — e.g. `LeBron J` searches given name and filters last initial

### `GET /api/dossier/[playerId]?season=`
- Input: player id + optional season
- Output: full `Dossier` JSON:
  - identity, detected role, fit grade, recommendation, confidence
  - pillars (percentiles), strengths/risks, evidence
  - methodology metadata (peer set, min minutes, scoring version)

### `GET /api/team-fit?ids=`
- Input: 1–5 unique positive BALLDONTLIE player ids, comma-separated
- Output: `{ teamFit: TeamFit }` — lineup-level aggregation of the players'
  individual dossiers (pillar means, lineup grade, balance callouts,
  thin-sample confidence). Reuses the cached dossier pipeline.
- Framing: individual profiles vs peers — **not** synergy or +/- modeling
- UI for the Nets home panel requires all five starters resolved; the route
  stays flexible (1–5) for validation and a future swap simulation

### Error envelope (typed)
Use stable machine codes the UI can map to empty/error/confidence states:

| Code | HTTP | Meaning |
|---|---|---|
| `validation_error` | 400 | Bad query/params |
| `not_found` | 404 | Unknown player |
| `thin_sample` | 200 with `confidence.thinSample` | Too few minutes — still return dossier when possible |
| `rate_limited` | 429 | Vendor rate limit (trial ≈ 5 req/min) |
| `upstream` | 502/503 | Vendor API failure |
| `invalid_payload` | 502 | Vendor response failed schema |

Prefer **explicit codes in JSON** over silent defaults. Thin sample is a first-class domain outcome, not a crash.

---

## 5. Validation policy

Aligned with [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) and [OWASP Proactive Control C3](https://top10proactive.owasp.org/archive/2024/the-top-10/c3-validate-input-and-handle-exceptions/):

1. **Validate on the server** before processing (never trust the client alone).
2. **Allow-list** shapes/ranges (ids, season, query length) — not denylist-only.
3. **Validate at every trust boundary:**
   - Incoming HTTP query/params
   - Outgoing vendor API JSON
   - Env config (API keys, base URLs)
4. **Validate once at the edge**, then pass `z.infer` types inward — do not re-parse the same trusted value in every layer.
5. Domain rules (e.g. “minutes too low for high confidence”) live in **scoring/application**, not in Zod schemas.

---

## 6. Caching & upstream resilience

Per [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers): handlers are **not cached by default**; opt in deliberately for safe `GET`s.

- **Application read-through cache** (`src/lib/cache/ttlCache.ts` + `createCachedNbaPort` + shared store via `getNbaResponseCache`): ~10 minute TTL on normalized domain values after Zod — search, season lines, recent games, composed dossiers, Nets roster. One `maxEntries` budget (LRU).
- In-flight coalescing (singleflight) so concurrent identical keys share one upstream call.
- Failures (`rate_limited`, `upstream`, etc.) are **not** cached.
- Process-local only (warm Node / serverless instance memory) — not Redis; cold starts start empty.
- Vendor `fetch` uses `cache: "no-store"`; the app cache is the deliberate layer (avoids fighting Next Data Cache + `Authorization` headers).
- Adapter isolates upstream flakiness; curated Nets seed remains the roster fallback.
- No retries that mask root causes (see root-cause-first rule).
- Cached values are **read-only** by contract (shared references); do not mutate port/dossier results.

---

## 7. Scoring contract (backend view)

- Deterministic templates for strengths/risks from metric thresholds — **no LLM in the scoring path for MVP** (explainable for the write-up).
- Peer percentiles computed in core against a defined peer set (role + min minutes).
- Version the methodology string in the dossier payload (`scoringVersion`) so UI/write-up stay aligned.

---

## 8. Non-goals (backend v1)

Auth, multi-tenant orgs, write DB, film URLs, salary joins, webhooks, background workers, GraphQL, separate Express/Nest service.

---

## 9. Bibliography (backend)

| Topic | Source |
|---|---|
| Ports & adapters / hexagonal | Alistair Cockburn — [Ports and Adapters](https://alistair.cockburn.us/hexagonal-architecture/) (see also [Wikipedia summary](https://en.wikipedia.org/wiki/Hexagonal_architecture_%28software%29)) |
| Next.js HTTP API | [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Caching guide](https://nextjs.org/docs/app/guides/caching-without-cache-components) |
| Input validation | [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [OWASP C3](https://top10proactive.owasp.org/archive/2024/the-top-10/c3-validate-input-and-handle-exceptions/) |
| Boundary validation + TS | Validate unknown at ingress; trust typed internals (community practice consistent with Zod-at-boundary guidance) |
| Product interpretation layer | Our outline: Cleaning the Glass / BBall Index as *framing* only — formulas remain original |
| NBA data API | [BALLDONTLIE](https://docs.balldontlie.io/) |

---

## 10. Data vendor: BALLDONTLIE (primary)

| Item | Value |
|---|---|
| Vendor | [BALLDONTLIE NBA API](https://docs.balldontlie.io/) |
| Base URL | `https://api.balldontlie.io` |
| Auth | `Authorization: <API_KEY>` header ([docs](https://docs.balldontlie.io/)) |
| Env | `BALLDONTLIE_API_KEY` — see `.env.example` |
| Adapter | First implementation of `NbaStatsPort` |

**Vendor decision (2026-07-27):** See [`VENDOR_DECISION.md`](./VENDOR_DECISION.md). Official NBA.com stats work locally but **fail from Vercel**. Production path is BALLDONTLIE (GOAT trial for Phase 2 build) with curated seed fallback — not an `nba_com` adapter on Vercel.

### Tier reality (plan around this)
Per BALLDONTLIE’s published endpoint matrix ([nba.balldontlie.io](https://nba.balldontlie.io/)):

| Need for RosterRadar | Typical tier note |
|---|---|
| Player search (`/nba/v1/players`) | Free tier |
| Teams / games | Free tier |
| Per-game player stats / active roster | Paid (e.g. ALL-STAR+) |
| Season averages endpoint | Higher tier (e.g. GOAT) |

**MVP approach (locked — see [`VENDOR_DECISION.md`](./VENDOR_DECISION.md)):**
- **Vendor:** BALLDONTLIE primary (GOAT trial for Phase 2 stats/roster endpoints).
- **Nets roster:** prefer live/active when the key allows; **curated seed** remains fallback (`rosterSeed.ts`).
- **Acquisition search:** live `/nba/v1/players?search=` with `excludeNets` (alias-aware).
- **Stats for scoring:** GOAT season averages / game stats; paid month covers the demo window (fixtures = fallback).
- **Not on Vercel runtime:** official NBA.com `stats.nba.com` adapter (local-only research if ever needed).

### Phase 1 checklist (done)
1. Account → `.env.local` key (never commit; rotate if exposed)
2. `GET /nba/v1/players?search=…` → Zod → `PlayerSummary`
3. Confirm tier entitlements when upgrading (GOAT trial)
4. Record limits in write-up / [`VENDOR_DECISION.md`](./VENDOR_DECISION.md) / AI log

---

## 11. Bibliography (data)

| Topic | Source |
|---|---|
| BALLDONTLIE docs | [docs.balldontlie.io](https://docs.balldontlie.io/), [nba.balldontlie.io](https://nba.balldontlie.io/) |
| OpenAPI | [nba.yml](https://www.balldontlie.io/openapi/nba.yml) |
