# Atlas Landing Page — Design Ideas

> **Design-phase exploration only.** These are standalone HTML/CSS mockups for
> review. No application code, routing, or the `/` redirect in
> `scripts/start-prod.js` has been changed.

## Goal

Today the Atlas root `/` 307-redirects straight to `/search` (see
`scripts/start-prod.js`). This explores replacing that with a **landing page of
curated views** — a set of cards, each representing a mission (or "everything")
with a sensible default filter set.

- Each curated-view card would navigate to **`/search?view=<view_id>`**, where
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

---

## Idea 1 — Card-grid gallery

A clean 3-column gallery of curated views, each with a hero thumbnail, product /
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

## Curated views depicted (illustrative)

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
