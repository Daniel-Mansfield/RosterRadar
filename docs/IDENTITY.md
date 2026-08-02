# RosterRadar — Identity & drawing board

**Purpose:** Product locks and keep / cut / later decisions.  
**Status:** v1 **shipped** (2026-08-02). Core IA + palette locked 2026-07-26; post–Phase 4 adds multi-slot sim + Radar pillar sort.  
**Related:** [`README.md`](./README.md) (docs map) · [`PROJECT_OUTLINE.md`](./PROJECT_OUTLINE.md) · [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) · `src/styles/palette.css`

---

## 1. Locked product shape (v1)

### Target team
- **Brooklyn Nets only** — no multi-team search in v1
- Home **is** the Nets roster experience (not a marketing landing + team picker)

### Home / Nets page
- Dark branded shell (`--graphite` base; see palette)
- Wordmark: **Roster** (`--brand-roster` / white, bold) + ***Radar*** (`--brand-radar` / intense cherry, thin italic)
- Roster as a **basketball half-court**: starting five as cards in positional spots; **bench** as a side list
- Player cards: **name + headshot** on Nets roster (curated ESPN ids); acquisition search uses curated map + best-effort ESPN resolve, initials on miss
- Click **Nets** card → **right drawer = role-fit scouting dossier**

### Player search (acquisition candidates)
- Search finds **only players not on the Brooklyn Nets**
- Selecting a result opens their **role-fit dossier** (evaluate as a potential addition)
- Search and Radar share **acquisition** lineup sims: swap icon or **Try in lineup** → starter slot; stack further slot changes; displaced real starters pinned Out (can return); Lineup Fit deltas + stacked banner. Bench swaps remain a true exchange. Does **not** model salary, packages, or synergy/+/-

### On the Radar
- Full curated pool in a **vertical scroll** column
- **Shuffle** redraws via random pick from the pool
- **Pillar sort** reorders the *current* list by any RR pillar (defaults to the real five’s primary Fit need) — not a league-wide attribute search

### Explicitly out of v1
- Team search / other franchises as home targets
- Guaranteed headshots for every search hit (best-effort ESPN; initials fallback)
- Full multi-player **trade packages** and salary/cap
- Projected team +/- / synergy from a simulated trade
- Compare-two-players view; “Evaluate as” role toggle
- Sticky dossier mini-header (optional polish, never shipped)

---

## 2. Original vision (archived)

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
| Entry | Nets home (fixed team) | Was player-first search | **Updated** — identity wins |
| Core artifact | Court + **dossier in drawer** | Scouting dossier | **Yes** |
| Full trade sim | Out of v1 | Non-goal for v1 | **Yes** |

**MVP story:** Open RosterRadar → see Brooklyn Nets on a half-court → click a Nets player for a role-fit dossier **or** search a non-Nets player to evaluate them as an acquisition candidate in the same drawer.

---

## 4. Keep / cut / later

### KEEP (shipped)
| Idea | Why |
|---|---|
| Dark brand + Roster / *Radar* wordmark | Core identity |
| Nets-only home as half-court roster | Scope cut that still feels like “Roster” |
| Headshots + initials fallback | Curated ESPN for Nets/Radar; best-effort for search |
| Drawer = role-fit dossier | Assignment MVP |
| Non-Nets player search | Acquisition evaluation |
| Bench list + starters on court | Readable roster structure |
| Lineup Fit + stacked one-for-one sim | Peer aggregation only — not a trade engine |
| On the Radar full pool + pillar sort | Gap-aware shortlist without league attribute search |
| Optional Tutorial (intro + bullets) | Coach marks on live UI |

### CUT (v1)
| Idea | Why |
|---|---|
| Team search / all 30 teams | Unnecessary if Nets are the target |
| Full DnD trade packages + team +/- | Out of credible 10-day scope |
| Compare two players / role toggle | Stretch; skipped when Phase 4 shipped |

### LATER (not required for submit)
| Idea | Notes |
|---|---|
| League-wide attribute / role-gap search | Radar sort covers curated pool only |
| Search combobox full ARIA | Arrow keys / `aria-activedescendant`; Tab/Enter work today |
| Sticky dossier mini-header | Name · Role · Fit on scroll |
| Guaranteed headshots for every search hit | Needs a more reliable photo source |

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
| 2026-07-26 | **Lock:** Player search = **non-Nets only** |
| 2026-07-26 | **Lock:** Brand palette (graphite / intense cherry / imperial blue / white / dim grey) |
| 2026-07-27 | Nets cards use curated ESPN headshots + initials fallback |
| 2026-07-27 | Half-court background: local PNG (`public/nets-halfcourt.png`) |
| 2026-08-02 | Multi-slot lineup sim + Radar pillar sort shipped; IDENTITY keep/cut/later synced |
