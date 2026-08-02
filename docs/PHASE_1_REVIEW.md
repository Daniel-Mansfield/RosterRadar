# Phase 1 review

**Historical.** Self-review of the scaffold (`phase-1/scaffold`, PR #1). Current product: [`IDENTITY.md`](./IDENTITY.md) · docs map: [`README.md`](./README.md).

## What shipped
- Null-safe seed ids (`number | null`); never invent synthetic BDL ids
- Debounced acquisition search + AbortController; client Zod on API JSON
- Shared `loadNetsRoster()`; typed `AppError` / `toErrorResponse`
- Basic drawer a11y (Escape, focus restore); muted-contrast token tweak
- Vercel hello deploy; vendor path locked later in [`VENDOR_DECISION.md`](./VENDOR_DECISION.md)

## Carried into later phases (then closed)
| Item | Closed in |
|---|---|
| Nickname exclude gap (Nic / Nicolas Claxton) | Phase 2 |
| Client Zod failure → empty list instead of error | Phase 2 |
| Drawer identity for dossier fetch | Phase 2 |
| Remaining null seed ids | Phase 2–3 |
| Unit tests | Phase 2 (`scoring/` + seed) |

## Still deferred
- Full dialog `inert` on backdrop siblings (P2-9) — Escape / Close / backdrop click work today
