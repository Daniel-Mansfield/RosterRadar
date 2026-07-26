# RosterRadar — Design System

Clarity-first scouting dossier UI. Inspiration: Leetify's "verdict in 5 seconds" structure + Cleaning the Glass seriousness. This doc is the source of truth for tokens, color, type, and layout.

## Principles (with sources)

- **Progressive disclosure, max 2 levels; level 1 self-sufficient; never hide decision-critical info** — [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [Nielsen’s 10 Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).
- **Role-based semantic tokens, not raw hex; accent added last; dark mode = token swap** — [Material Design 3 color roles](https://m3.material.io/styles/color/roles), [MD3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3).
- **Accessible contrast** — [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (text 4.5:1; large text 3:1) and SC 1.4.11 Non-text (UI/graphics 3:1); [SC 1.4.1 Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color).
- **Mobile-first responsive** — [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design), [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries).

## Color tokens

Semantic names only. Components reference tokens, never hex. Values below are the light theme; dark theme re-resolves the same tokens.

### Surface & content (neutral base — slate)
| Token | Hex | Use |
|---|---|---|
| `--surface-base` | `#FFFFFF` | Page background |
| `--surface-subtle` | `#F8FAFC` | Section / muted background |
| `--surface-raised` | `#FFFFFF` | Cards (with border/shadow) |
| `--border` | `#E2E8F0` | Dividers, card borders, input borders |
| `--content-primary` | `#0F172A` | Primary text, headings, grade |
| `--content-muted` | `#64748B` | Secondary text, labels, captions |
| `--on-accent` | `#FFFFFF` | Text/icons on accent |

### Accent (exactly one — indigo)
| Token | Hex | Use |
|---|---|---|
| `--accent` | `#4F46E5` | Primary actions, key verdict emphasis, active states |
| `--accent-hover` | `#4338CA` | Hover/pressed for accent |
| `--accent-subtle` | `#EEF2FF` | Accent-tinted backgrounds (chips, highlights) |

### Fit signals (status only — never decorative)
Always paired with text/icon, not color alone.
| Token | Text/Icon | Background | Meaning |
|---|---|---|---|
| `--fit-strong` | `#15803D` | `#DCFCE7` | Strong fit |
| `--fit-conditional` | `#B45309` | `#FEF3C7` | Conditional fit |
| `--fit-poor` | `#B91C1C` | `#FEE2E2` | Poor fit |

All foreground/background pairings above target WCAG AA (≥4.5:1 for text). Re-verify any new pairing with a contrast checker before adding it.

### Percentile bar
- Track: `--surface-subtle`; fill: `--content-muted` for mid ranges.
- Emphasis only at extremes: top ~20% uses `--fit-strong` text color, bottom ~20% uses `--fit-poor`. Muted middle to avoid rainbow charts.

## Typography

- **Display / grade:** one strong family (e.g. a geometric or editorial sans) for player name + fit grade.
- **Body / metrics:** one clean sans (e.g. Inter / system UI stack).
- Fluid sizing with `clamp()`; base `16px`. Hierarchy: Grade → Verdict sentence → Pillars → Details.
- Large text threshold for AA 3:1 = ≥24px (or ≥19px bold).

## Spacing & layout

- Spacing scale (rem): `0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3`.
- Generous whitespace between sections; tight grouping within a card.
- Dossier grid: single column on mobile; `grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))` for pillar cards.

## Breakpoints (min-width, mobile-first, in em)

| Name | Min width |
|---|---|
| base | 0 (mobile) |
| sm | `40em` (~640px) |
| md | `48em` (~768px) |
| lg | `64em` (~1024px) |

Base CSS targets mobile; layers added with `min-width` queries. Prefer fluid grids/`clamp()`/container queries over adding breakpoints.

## Component states (required)
Every data view designs: **loading** (skeleton matching layout), **empty** ("no player / limited sample"), **error** (clear recovery). Reflects WCAG/NN/g "visibility of system status".

## Motion
- Subtle, purposeful transitions only. Honor `prefers-reduced-motion: reduce`.
