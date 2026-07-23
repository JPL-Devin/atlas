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
