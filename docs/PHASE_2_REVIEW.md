# Phase 2 review

Standards QA after the dossier vertical slice (PR #3). Detail of individual fixes is in git history.

## What shipped
- Pure `scoring/` + unit tests; `GET /api/dossier/[id]`; drawer `DossierPanel`
- Layering: `parseMinutes` in `nba/`; `rate_limited` (HTTP 429); explicit `confidence.thinSample`
- Process-local TTL cache + singleflight + shared LRU (see [`BACKEND.md`](./BACKEND.md) §6)
- UI polish: tokens, evidence table a11y, fit-class typing, portrait cards, curated Nets ESPN headshots
- Alias-based Nets exclusion; client Zod errors surface as errors (not empty search)

## Still deferred / accepted
| Item | Notes |
|---|---|
| Dialog `inert` (P2-9) | Backdrop siblings not inert; focus trap is drawer-scoped |
| Prior-season cold miss | Cache mitigates; first miss can still be 2–3 vendor calls |
| Adapter `?? 0` on optional box fields | Prefer explicit nulls if BDL starts omitting fields |
| Court PNG license | Third-party (Signs by SI) — keep attribution in [`IDENTITY.md`](./IDENTITY.md) |

Drawer hook extract and null seed ids were closed in Phase 3.
