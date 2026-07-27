# RosterRadar — Identity & drawing board

**Purpose:** Capture the *core feeling* of RosterRadar, map it to the assignment outline, and record keep / cut / later decisions. Living template for identity—not every idea ships in the 10-day MVP.

**Status:** Core IA + brand palette **locked** (2026-07-26). Trade/DnD still later.

**Related:** [`PROJECT_OUTLINE.md`](./PROJECT_OUTLINE.md) · [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) · `src/styles/palette.css`

---

## 1. Locked product shape (v1)

### Target team
- **Brooklyn Nets only** — no multi-team search in v1
- Home **is** the Nets roster experience (not a separate marketing landing + team picker)

### Home / Nets page
- Dark branded shell (`--graphite` base; see palette)
- Wordmark: **Roster** (`--brand-roster` / white, bold) + ***Radar*** (`--brand-radar` / intense cherry, thin italic)
- Roster as a **basketball half-court**: starting five as cards in positional spots; **bench** as a side list
- Player cards: **name + headshot** on Nets roster (curated ESPN ids); initials fallback; acquisition search uses initials (no photo pipeline)
- Click **Nets** card → **right drawer = role-fit scouting dossier**

### Player search (acquisition candidates)
- Search finds **only players not on the Brooklyn Nets** (you can’t trade for someone already on the roster)
- Selecting a search result opens their **role-fit dossier in the drawer** (evaluate as a potential addition)
- Does **not** perform a live trade or rewrite the court in v1 (DnD / projections = later)

### Explicitly out of v1
- Team search / other franchises as home targets
- Full BDL→NBA headshot pipeline for arbitrary search results (Nets use curated ESPN ids only)
- Drag-and-drop trades onto the court
- Projected team +/- from a simulated trade

---

## 2. Original vision (archived notes)

Preserved for history; superseded by §1 where they conflict.

- Multi-team search from home
- Cards with name + image; drawer with image + raw “important stats”
- Recommended carousel + drag onto court/bench with projected team impact

---

## 3. Alignment with assignment outline

| Theme | Locked identity | Outline | Aligns? |
|---|---|---|---|
| Decision-maker framing | Nets roster context + fit dossier | FO/scouting role-fit | **Yes** |
| Opinionated UI | Court + drawer + brand | Verdict-first dossier | **Yes** |
| Progressive disclosure | Card → dossier drawer | Hero → details | **Yes** |
| Entry | Nets home (fixed team) | Was player-first search | **Updated** — outline should follow identity |
| Core artifact | Court + **dossier in drawer** | Scouting dossier | **Yes (merged)** |
| Trade sim | Later | Non-goal for v1 | **Yes** |

**MVP story:** Open RosterRadar → see Brooklyn Nets on a half-court → click a Nets player for a role-fit dossier **or** search a non-Nets player to evaluate them as an acquisition candidate in the same drawer.

---

## 4. Keep / cut / later (confirmed)

### KEEP
| Idea | Why |
|---|---|
| Dark brand + Roster / *Radar* wordmark | Core identity |
| Nets-only home as half-court roster | Scope cut that still feels like “Roster” |
| Name-only player cards | **Updated:** Nets cards use curated ESPN headshots + initials fallback; search uses initials |
| Drawer = role-fit dossier | Assignment MVP + your interaction model |
| Player search near the roster | Non-Nets only — acquisition evaluation |
| Bench list + starters on court | Readable roster structure |

### CUT (v1)
| Idea | Why |
|---|---|
| Team search / all 30 teams | Unnecessary if Nets are the target |
| Player photos | Deferred; names enough |
| DnD trade + team projections | Out of credible 10-day scope |

### LATER
| Idea | Notes |
|---|---|
| Player search carousel / recommendations by role gap | After dossier + court work |
| Click-to-preview non-Nets player in drawer | Lighter than DnD |
| Visual swap without numeric projection | Optional stretch |
| Headshots | When we have a reliable source |

---

## 5. Palette CSS

**Locked** in `src/styles/palette.css` and mapped to semantic tokens in `src/app/globals.css`.

| Token | Hex |
|---|---|
| `--graphite` | `#28292aff` |
| `--intense-cherry` | `#d21143ff` |
| `--imperial-blue` | `#00275eff` |
| `--white` | `#fefefeff` |
| `--dim-grey` | `#747474ff` |

---

## 6. Decision log

| Date | Decision |
|---|---|
| 2026-07-26 | Vision captured; hybrid court + dossier proposed |
| 2026-07-27 | **Update:** Nets player cards use curated ESPN headshots (Option B) + card chrome; full BDL→NBA photo pipeline still deferred |
| 2026-07-27 | Half-court background: local PNG from Signs by SI half-court graphic (`public/nets-halfcourt.png`); panel `aspect-ratio` matches source |
| 2026-07-26 | **Lock:** Player search = **non-Nets only** (acquisition candidates → dossier drawer) |
| 2026-07-26 | **Lock:** Brand palette (graphite / intense cherry / imperial blue / white / dim grey) |
