# RosterRadar — Design System

Clarity-first scouting dossier UI on a dark branded shell. Identity: [`IDENTITY.md`](./IDENTITY.md). Inspiration: Leetify clarity structure + staff-serious tone.

## Principles (with sources)

- **Progressive disclosure, max 2 levels; level 1 self-sufficient; never hide decision-critical info** — [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [Nielsen’s 10 Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).
- **Role-based semantic tokens, not raw hex** — [Material Design 3 color roles](https://m3.material.io/styles/color/roles).
- **Accessible contrast** — [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) / [SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast); never color alone ([SC 1.4.1](https://www.w3.org/TR/WCAG22/#use-of-color)).
- **Mobile-first responsive** — [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design).

## Brand palette (source)

Raw brand variables live in `src/styles/palette.css`. Components should use **semantic** tokens from `globals.css`, not brand names—except the wordmark helpers.

| Brand token | Value | Role |
|---|---|---|
| `--graphite` | `#28292aff` | App background |
| `--intense-cherry` | `#d21143ff` | Accent / *Radar* |
| `--imperial-blue` | `#00275eff` | Subtle panels |
| `--court-matte` | `#001c42` | Half-court panel behind floor art |
| `--white` | `#fefefeff` | Primary text / **Roster** |
| `--dim-grey` | `#747474ff` | Muted text |

## Semantic color tokens

### Surface & content (dark shell)
| Token | Resolves from | Use |
|---|---|---|
| `--surface-base` | graphite | Page background |
| `--surface-subtle` | imperial blue | Court / section panels |
| `--surface-raised` | graphite mixed lighter | Cards, drawer surface |
| `--border` | dim-grey (soft) | Dividers, card edges |
| `--content-primary` | white | Primary text, headings, grade |
| `--content-muted` | dim-grey mixed toward white | Labels, captions (AA on graphite) |
| `--on-accent` | white | Text on cherry buttons/chips |
| `--brand-roster` | white | “Roster” wordmark |
| `--brand-radar` | intense cherry | “*Radar*” wordmark |

### Accent (exactly one — intense cherry)
| Token | Use |
|---|---|
| `--accent` | Primary actions, *Radar*, key emphasis |
| `--accent-hover` | Hover/pressed |
| `--accent-subtle` | Tinted chips / highlights on graphite |

### Fit signals (status only — never decorative)
Distinct from brand cherry so fit ≠ branding. Always pair with text/icon.
| Token | Meaning |
|---|---|
| `--fit-strong` (+ bg) | Strong fit |
| `--fit-conditional` (+ bg) | Conditional fit |
| `--fit-poor` (+ bg) | Poor fit |

Re-check contrast on graphite before shipping new pairings.

### Percentile bar
- Track: muted border/surface; fill mid-range with `--content-muted`
- Extremes only: strong / poor fit colors

## Typography

- **Roster:** bold, `--brand-roster`
- **Radar:** thin italic, `--brand-radar`
- Body/metrics: clean sans; hierarchy Grade → Verdict → Pillars → Details
- Fluid type with `clamp()`; base `16px`

## Spacing & layout

- Spacing scale (rem): `0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3`
- Home: half-court + bench; dossier in right drawer
- Mobile: stack court / bench; drawer as full-height sheet if needed

## Breakpoints (min-width, mobile-first, in em)

| Name | Min width |
|---|---|
| base | 0 |
| sm | `40em` |
| md | `48em` |
| lg | `64em` |

## Component states (required)
Loading / empty / error / thin-sample for roster and dossier.

## Motion

Subtle, functional motion only (FO / ops tone — not marketing flair).

| Token | Duration | Use |
|---|---|---|
| `--motion-fast` | 120ms | Hover / press |
| `--motion-ui` | 200ms | Content crossfade, list reorder cue |
| `--motion-panel` | 280ms | Drawer enter / exit |
| `--ease-out` | cubic-bezier(0.22, 1, 0.36, 1) | Panel / enter |
| `--ease-standard` | ease | Simple UI |

**Rules**
- Prefer `transform` + `opacity` (compositor-friendly).
- Honor `prefers-reduced-motion: reduce` — large slides collapse to short fades; continuous loops opt in via `no-preference`.
- Animate state changes that orient the user (drawer, load→ready, sort reorder), not decorative noise.
