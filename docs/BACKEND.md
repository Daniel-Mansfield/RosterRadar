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
| Data vendor | **BALLDONTLIE NBA API** (default); **NBA.com spike under evaluation** | Documented REST + key auth today; see §10 and [`SPIKE_NBA_COM.md`](./SPIKE_NBA_COM.md) |

---

## 2. Architecture (ports & adapters)

Inspired by Alistair Cockburn’s **Ports and Adapters** (hexagonal architecture): keep the application core free of UI and infrastructure details so adapters (NBA API, HTTP) can change without rewriting business logic.

```
┌─────────────────────────────────────────────┐
│  Driving adapter: Route Handlers (HTTP)     │
│    /api/players  ·  /api/dossier/[id]       │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  Application core                           │
│    composeDossier()  ·  searchPlayers()     │
│    scoring/*  (pure)                        │
└─────────────────────┬───────────────────────┘
                      │  port: NbaStatsPort
┌─────────────────────▼───────────────────────┐
│  Driven adapter: NBA API client             │
│    fetch → Zod parse → domain types         │
└─────────────────────────────────────────────┘
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

### `GET /api/dossier/[playerId]?season=`
- Input: player id + optional season
- Output: full `Dossier` JSON:
  - identity, detected role, fit grade, recommendation, confidence
  - pillars (percentiles), strengths/risks, evidence
  - methodology metadata (peer set, min minutes, scoring version)

### Error envelope (typed)
Use stable machine codes the UI can map to empty/error/confidence states:

| Code | HTTP | Meaning |
|---|---|---|
| `validation_error` | 400 | Bad query/params |
| `not_found` | 404 | Unknown player |
| `thin_sample` | 200 with low confidence *or* dedicated flag | Too few minutes — still return dossier when possible |
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

- Short TTL / `revalidate` for vendor fetches to respect rate limits.
- Cache **normalized** domain data when helpful — never use cache to hide bad normalization.
- Adapter isolates upstream flakiness; optional seeded demo players for offline/demo (document clearly).
- No retries that mask root causes (see root-cause-first rule); limited, explicit backoff only if the vendor documents it.

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

## 10. Data vendor: BALLDONTLIE (current default)

| Item | Value |
|---|---|
| Vendor | [BALLDONTLIE NBA API](https://docs.balldontlie.io/) |
| Base URL | `https://api.balldontlie.io` |
| Auth | `Authorization: <API_KEY>` header ([docs](https://docs.balldontlie.io/)) |
| Env | `BALLDONTLIE_API_KEY` — see `.env.example` |
| Adapter | First implementation of `NbaStatsPort` |

**Vendor decision (post–Phase 1):** Free BALLDONTLIE cannot power dossier stats/roster. Before Phase 2 scoring, run the bounded NBA.com spike in [`SPIKE_NBA_COM.md`](./SPIKE_NBA_COM.md). PASS → add `nba_com` adapter (keep BALLDONTLIE fallback). FAIL → BALLDONTLIE paid trial/upgrade. Do not dual-live two primary vendors during scoring work.

### Tier reality (plan around this)
Per BALLDONTLIE’s published endpoint matrix ([nba.balldontlie.io](https://nba.balldontlie.io/)):

| Need for RosterRadar | Typical tier note |
|---|---|
| Player search (`/nba/v1/players`) | Free tier |
| Teams / games | Free tier |
| Per-game player stats / active roster | Paid (e.g. ALL-STAR+) |
| Season averages endpoint | Higher tier (e.g. GOAT) |

**MVP approach (locked):**
- **Nets roster:** curated seed in `src/nba/nets/rosterSeed.ts` (free tier cannot reliably list *current* active roster by team — `team_ids` returns historical associations; `/players/active` returns 401 on free).
- **Acquisition search:** live `/nba/v1/players?search=` with `excludeNets`.
- **Stats for scoring:** when endpoints are unavailable, aggregate from accessible data or document paid-tier upgrade; keep `NbaStatsPort` swappable.

### Spike checklist (Phase 1)
1. Create account → copy key into `.env.local` (never commit)
2. `GET /nba/v1/players?search=…` → Zod → `PlayerSummary`
3. Confirm which stats endpoints the key’s tier allows
4. Record tier limits in the write-up / AI log if relevant

---

## 11. Bibliography (data)

| Topic | Source |
|---|---|
| BALLDONTLIE docs | [docs.balldontlie.io](https://docs.balldontlie.io/), [nba.balldontlie.io](https://nba.balldontlie.io/) |
| OpenAPI | [nba.yml](https://www.balldontlie.io/openapi/nba.yml) |
