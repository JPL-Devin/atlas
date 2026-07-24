# Atlas Splash Page — Design Ideas

> **Design-phase exploration only.** These are standalone HTML/CSS mockups for
> review. No application code, routing, or the `/` redirect in
> `scripts/start-prod.js` has been changed.

## Goal

Today the Atlas root `/` 307-redirects straight to `/search` (see
`scripts/start-prod.js`). This explores replacing that with a **splash page for
Atlas** — a set of cards, each representing a mission (or "everything") with a
sensible default filter set.

- Each mission card would navigate to **`/search?view=<view_id>`**, where
  `view_id` maps to a hardcoded set of default filters
  (e.g. `view=m20` → `mission = mars_2020`).
- An **"Everything" card** links to bare **`/search`**, preserving the current
  default behavior (no default filters).
- The `view` param is purely additive: `/search` and any existing filter params
  keep working exactly as they do today.

The mockups reuse the existing Atlas visual language — the dark palette from
`src/themes/index.js` (bg `#12181e`/`#192028`, accent blue `#62c6f5`, accent
yellow `#fee24a`), the **Inter** / **Public Sans** typefaces, and MUI-style
surfaces — but are self-contained HTML/CSS and do **not** import from the app
build. Mission thumbnails are CSS-gradient placeholders; product counts are
illustrative.

The HTML sources and screenshots live in
[`landing-page-design-ideas/`](landing-page-design-ideas/).

> **Two rounds below.** Round 2 (Ideas 5–9) is the recommended set: it reuses the
> **real Atlas chrome** — the light-theme horizontal Topbar (NASA logo, PDS
> Cartography & Imaging Sciences wordmark, right-side icon buttons) from
> `src/components/Topbar/index.js` and the dark left vertical Toolbar from
> `src/components/Toolbar/Toolbar.js` — via a shared
> [`_atlas-chrome.css`](landing-page-design-ideas/_atlas-chrome.css). Round 1
> (Ideas 1–4) was an earlier exploration that used a simplified dark bar and
> didn't yet match the app's actual color scheme.

---

# Round 4 — timeline explorations + Core/Raws deep-dives

Timeline/Gantt takes (missions as bars across time; ongoing bars run to **now**)
plus two more Core-vs-Raws directions with themed collections under each heading.

### 20 · Full-screen Gantt
Label column + bars across a decade axis; stats inside wide bars, ongoing → now.
![](landing-page-design-ideas/mockup-20-gantt-fullscreen.png)

### 21 · Bar cards
Taller bar-cards with sparklines and image counts; short missions collapse to compact.
![](landing-page-design-ideas/mockup-21-gantt-cards.png)

### 22 · Vertical timeline
Time flows top→bottom; each mission is a column, ongoing reaching the bottom.
![](landing-page-design-ideas/mockup-22-gantt-vertical.png)

### 23 · Scrolling timeline
Horizontally scrollable decade rail with staggered mission bars.
![](landing-page-design-ideas/mockup-23-gantt-scroll.png)

### 24 · Swimlanes by world
Bars grouped into lanes per target body (Mars, Moon, Saturn, Jupiter).
![](landing-page-design-ideas/mockup-24-gantt-swimlanes.png)

### 25 · Activity Gantt
Dark timeline; bar gradient encodes downlink volume, pulse on live missions.
![](landing-page-design-ideas/mockup-25-gantt-intensity.png)

### 26 · Core vs Raws + collections
Two entry panels (Archive / Raws), each with themed collections listed beneath.
![](landing-page-design-ideas/mockup-26-core-raws-collections.png)

### 27 · Core vs Raws bands
Stacked full-bleed Core/Raws bands, each with a row of collection cards.
![](landing-page-design-ideas/mockup-27-core-raws-bands.png)

---

# Round 3 — creative concepts

Standalone HTML using the real Atlas chrome. Explores free-text search, themed
collections (not just missions), a Core/Archive vs Raws split, news/activity, and
alternate layouts. Themed views link to `/search?view=<id>`; Raws to
`/search?atlas=raws`; Everything to `/search`.

### 10 · Center search
Google-style centered wordmark + free-text search, Core/Raws toggle, quick chips.
![](landing-page-design-ideas/mockup-10-search-center.png)

### 11 · Themed collections
Featured themes (Cassini Grand Finale, Jezero deltas, Ingenuity…) over a mission row.
![](landing-page-design-ideas/mockup-11-themed-collections.png)

### 12 · Core vs Raws
Two big entry panels — calibrated Archive vs latest Raws — above a shared search.
![](landing-page-design-ideas/mockup-12-core-vs-raws.png)

### 13 · News column
Mission grid with a live "Latest from PDS Imaging" activity column on the right.
![](landing-page-design-ideas/mockup-13-news-column.png)

### 14 · Explore worlds
Clickable target bodies (Mars, Moon, Saturn…) with a center search.
![](landing-page-design-ideas/mockup-14-explore-worlds.png)

### 15 · Magazine
Editorial layout: big featured collection, side stories, mission strip.
![](landing-page-design-ideas/mockup-15-magazine.png)

### 16 · Command deck
Center search + Core/Raws/Everything segmented control, live counts, collection rail.
![](landing-page-design-ideas/mockup-16-command-deck.png)

### 17 · Timeline
Missions placed on a 1969→now archive timeline, plus search.
![](landing-page-design-ideas/mockup-17-timeline.png)

### 18 · Bento
Mixed-size bento grid: search, featured collection, missions, raws feed, stats.
![](landing-page-design-ideas/mockup-18-bento.png)

### 19 · Dark hero
Dramatic starfield hero with center search + Core/Raws switch; tiles below.
![](landing-page-design-ideas/mockup-19-dark-hero.png)

---

# Round 2 — matches the real Atlas chrome & palette

These reuse the actual Topbar + left Toolbar and the light-theme palette from
`src/themes/light.js` (content bg `#f5f5f5`, accent blue `#1c67e3`, active
`#288bff`, darkgoldenrod PDS/page labels, red cart badge). Public Sans / Inter
typefaces. Each is standalone HTML linking `_atlas-chrome.css`.

## Idea 5 — Splash hero + mission tile grid

Centered hero headline over a 3-column grid of mission tiles; the **Everything**
tile is highlighted in Atlas blue. The most direct "front door" for the app.

Source: [`landing-page-design-ideas/mockup-5-splash-hero-grid.html`](landing-page-design-ideas/mockup-5-splash-hero-grid.html)

![Splash hero + mission grid mockup](landing-page-design-ideas/mockup-5-splash-hero-grid.png)

## Idea 6 — Search-forward splash

Leads with a large search field (the primary action), a row of quick mission
chips, and a compact tile row below. Emphasizes "search first, browse second".

Source: [`landing-page-design-ideas/mockup-6-search-forward.html`](landing-page-design-ideas/mockup-6-search-forward.html)

![Search-forward splash mockup](landing-page-design-ideas/mockup-6-search-forward.png)

## Idea 7 — Two-column: intro + mission list

A sticky intro/stats column on the left (with a "Browse everything" CTA) beside
a dense mission list on the right. Good for pairing context with quick jumps.

Source: [`landing-page-design-ideas/mockup-7-two-column.html`](landing-page-design-ideas/mockup-7-two-column.html)

![Two-column splash mockup](landing-page-design-ideas/mockup-7-two-column.png)

## Idea 8 — Featured banner + secondary row

A light gradient banner introduces Atlas, a large featured mission gets prime
placement with stats and a CTA, and a secondary card row (including
**Everything**) covers the rest.

Source: [`landing-page-design-ideas/mockup-8-featured-banner.html`](landing-page-design-ideas/mockup-8-featured-banner.html)

![Featured banner splash mockup](landing-page-design-ideas/mockup-8-featured-banner.png)

## Idea 9 — Dashboard splash

An instrument-panel layout: a KPI stat strip over mission cards with per-card
stat readouts and the `GET /search?view=<id>` contract surfaced in the header.
Leans into the data/science-operations feel while staying on the light palette.

Source: [`landing-page-design-ideas/mockup-9-dashboard.html`](landing-page-design-ideas/mockup-9-dashboard.html)

![Dashboard splash mockup](landing-page-design-ideas/mockup-9-dashboard.png)

---

# Round 1 — earlier dark exploration

---

## Idea 1 — Card-grid gallery

A clean 3-column gallery of mission cards, each with a hero thumbnail, product /
instrument counts, and its `view=<id>` shown as a code chip. The **Everything**
card is highlighted in the accent yellow. Best for browsing many missions at a
glance.

Source: [`landing-page-design-ideas/mockup-1-card-grid.html`](landing-page-design-ideas/mockup-1-card-grid.html)

![Card-grid gallery mockup](landing-page-design-ideas/mockup-1-card-grid.png)

---

## Idea 2 — Compact list / tile layout

A denser single-column list, grouped into "Featured missions" and "Everything".
Each row shows a mission glyph, filter mapping, count, and `view=<id>`. Scales
to many views without a lot of vertical real estate.

Source: [`landing-page-design-ideas/mockup-2-compact-list.html`](landing-page-design-ideas/mockup-2-compact-list.html)

![Compact list mockup](landing-page-design-ideas/mockup-2-compact-list.png)

---

## Idea 3 — Hero header + featured view + secondary card row

A marketing-style hero band introduces the concept, a large **featured view**
(Mars 2020) gets prime placement with stats and a call-to-action, and a
secondary row of smaller cards (including **Everything**) covers the rest. Good
for spotlighting a mission or campaign.

Source: [`landing-page-design-ideas/mockup-3-hero-featured.html`](landing-page-design-ideas/mockup-3-hero-featured.html)

![Hero + featured mockup](landing-page-design-ideas/mockup-3-hero-featured.png)

---

## Idea 4 — Dark "mission console" data-tool aesthetic

A denser, instrument-panel look: subtle grid backdrop, monospace readouts,
per-card stat strips, and a live "archive online" status. Leans into the
science/data-operations feel. The route contract `GET /search?view=<id>` is
surfaced explicitly in the header.

Source: [`landing-page-design-ideas/mockup-4-dark-console.html`](landing-page-design-ideas/mockup-4-dark-console.html)

![Dark console mockup](landing-page-design-ideas/mockup-4-dark-console.png)

---

## Mission shortcuts depicted (illustrative)

| Card | `view_id` | Default filter | Destination |
|---|---|---|---|
| Mars 2020 / Perseverance | `m20` | `mission = mars_2020` | `/search?view=m20` |
| MSL / Curiosity | `msl` | `mission = mars_science_laboratory` | `/search?view=msl` |
| InSight | `insight` | `mission = insight` | `/search?view=insight` |
| Mars Reconnaissance Orbiter | `mro` | `mission = mro` | `/search?view=mro` |
| Cassini / Saturn | `cassini` | `mission = cassini` | `/search?view=cassini` |
| Lunar Reconnaissance Orbiter | `lro` | `mission = lro` | `/search?view=lro` |
| **Everything · All data** | — | none | `/search` |

## Notes for a future implementation (not done here)

- `view_id → default filters` would live in a small config map (conceptually
  alongside `src/core/appConfig.js`'s `defaultFilters`).
- `/search` already strips unknown params (see `AGENTS.md`), so introducing
  `view` would require Search to read and expand it into the existing filter
  state rather than dropping it.
- The `/` → `/search` redirect would become `/` → landing page; `/search`
  itself stays the canonical "Everything" entry point.
