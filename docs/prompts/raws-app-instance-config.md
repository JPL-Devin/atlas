# Unified App Instance Configuration — Multi-Devin Implementation Plan

> **Objective:** Transform Atlas from a single-instance application into a
> multi-instance platform that serves both the current **Atlas** search UI and a
> new **Planetary Raws** instance, driven entirely by a shared configuration
> object. Feature toggles, behavioral defaults, endpoints, and the main-menu
> drawer must all derive from a single `getAppConfig()` call.

---

## How to execute this prompt

Use **multi-Devin** (parallel sub-agents) to maximise throughput:

1. **Phase 1 — Workstream A (Foundation):** Spawn **one** sub-agent.
   It creates `src/core/appConfig.js`, updates the runtime-config plumbing,
   and adds unit tests. No other workstream can start until A's branch is
   merged into `main`.
2. **Phase 2 — Workstreams B, C, D (parallel):** After A merges, spawn
   **up to 12** sub-agents simultaneously (B1–B4, C1–C7, D). Each sub-agent
   works on a **separate feature branch** off the new `main` (which includes A).
3. Each sub-agent pushes to its own named branch but **does NOT create a PR**.
   The parent session creates one consolidated PR that merges all branches.

### TDD mandate (applies to every sub-agent)

1. Write failing tests **first** (unit or Playwright e2e as appropriate).
2. Implement just enough production code to make the tests pass.
3. Verify lint (`npm run lint`) passes before pushing.

### Branch naming convention

```
devin/<timestamp>-<workstream>-<short-slug>
```

Example: `devin/1780000000-b1-cart-toggle`

---

## Workstream A — Foundation: Unified App Instance Configuration

> **Must complete and merge before any other workstream starts.**

### A1 — Create `src/core/appConfig.js`

Create the file with two named hardcoded config objects (`atlas`, `raws`) and
two exported functions:

```js
// src/core/appConfig.js

const atlas = {
    appTitle: 'Atlas',
    enableCart: true,
    enableArchiveExplorer: true,
    enableMap: true,
    enableAddFilters: true,
    defaultDownloadProduct: 'src',
    defaultSortField: 'gather.time.start_time',
    defaultSortDirection: 'desc',
    aboutTitle: 'Atlas',
    aboutDescription:
        'The Cartography and Imaging Sciences Node of the Planetary Data System ' +
        'provides a set of applications under the name, "Atlas". These applications ' +
        'allow users to explore, search, and download imaging and data products that ' +
        'have been collected from a variety NASA\'s planetary space missions. Through ' +
        'the use of these tools, users have access to petabytes of imaging data in one ' +
        'central location. This collection of data is updated periodically and is ' +
        'reported within the Latest News section of our home page.',
    aboutContactUrl: '',
    defaultFilters: [
        '_text',
        'gather.common.mission',
        'gather.common.spacecraft',
        'gather.common.instrument',
        'gather.common.target',
        'gather.common.product_type',
        'gather.common.kind',
        'archive.bundle_id',
        'gather.machine_learning.classification.classifications.class',
        'gather.machine_learning.classification.classifications.confidence',
    ],
    defaultFilterValues: {},
    drawerOrder: 0,
    drawerLabel: 'Atlas',
    baseUrl: '',
    dataEndpoint: '/data',
    searchEndpoint: '/search/atlas/_search',
    pitEndpoint: '/search/atlas/_pit',
    scrollEndpoint: '/search/_search/scroll',
    archiveEndpoint: '/search/atlas/_search',
}

const raws = {
    appTitle: 'Planetary Raws',
    enableCart: false,
    enableArchiveExplorer: false,
    enableMap: false,
    enableAddFilters: false,
    defaultDownloadProduct: 'browse',
    defaultSortField: 'gather.time.start_time',
    defaultSortDirection: 'desc',
    aboutTitle: 'Planetary Raws',
    aboutDescription:
        'Planetary Raws provides rapid access to the latest raw and partially ' +
        'processed images returned by NASA\'s planetary missions. Browse the newest ' +
        'downlinks, search by mission, instrument, or target, and download browse-quality ' +
        'products directly.',
    aboutContactUrl: 'https://pds-imaging.jpl.nasa.gov/help/help.html',
    defaultFilters: [
        '_text',
        'gather.common.mission',
        'gather.common.spacecraft',
        'gather.common.instrument',
        'gather.common.target',
        'gather.common.product_type',
    ],
    defaultFilterValues: {
        'gather.common.product_type': { exclude: ['Movie Frame'] },
    },
    drawerOrder: 1,
    drawerLabel: 'Planetary Raws',
    baseUrl: 'https://pds-imaging.jpl.nasa.gov/tools/raws',
    dataEndpoint: '/data',
    searchEndpoint: '/search/raws/_search',
    pitEndpoint: '/search/raws/_pit',
    scrollEndpoint: '/search/_search/scroll',
    archiveEndpoint: '/search/raws/_search',
}

const instances = { atlas, raws }

/**
 * Returns the config object for the active app instance.
 *
 * Resolution order:
 *   1. window.APP_CONFIG.APP_INSTANCE  (production — server-injected)
 *   2. process.env.REACT_APP_APP_INSTANCE  (development — CRA .env)
 *   3. 'atlas'  (default)
 */
export const getAppConfig = () => {
    let instanceKey = 'atlas'
    if (typeof window !== 'undefined' && window.APP_CONFIG?.APP_INSTANCE) {
        instanceKey = window.APP_CONFIG.APP_INSTANCE
    } else if (process.env.REACT_APP_APP_INSTANCE) {
        instanceKey = process.env.REACT_APP_APP_INSTANCE
    }
    return instances[instanceKey] || instances.atlas
}

/**
 * Returns all registered instance configs, keyed by instance name.
 * Used by the shared main-menu drawer to build cross-instance links.
 */
export const getAllInstances = () => instances
```

### A2 — Update `scripts/start-prod.js` (lines 22–32)

Add `APP_INSTANCE` to the `runtimeConfig` object so the server injects it into
`window.APP_CONFIG`:

```js
const runtimeConfig = {
    PUBLIC_URL: process.env.PUBLIC_URL || '',
    DOMAIN: process.env.REACT_APP_DOMAIN || '',
    API_URL: process.env.REACT_APP_API_URL || '',
    ES_URL: process.env.REACT_APP_ES_URL || '',
    FOOTPRINT_URL: process.env.REACT_APP_FOOTPRINT_URL || '',
    IMAGERY_URL: process.env.REACT_APP_IMAGERY_URL || '',
    REGISTRY_URL: process.env.REACT_APP_REGISTRY_URL || '',
    DOI_URL: process.env.REACT_APP_DOI_URL || '',
    APP_INSTANCE: process.env.APP_INSTANCE || 'atlas',   // <-- add
}
```

### A3 — Update `src/core/runtimeConfig.js`

Add a `getAppInstance()` getter following the same runtime-config pattern used
by the existing getters (check `window.APP_CONFIG` first, fall back to
`process.env`):

```js
export const getAppInstance = () => {
    if (typeof window !== 'undefined' && window.APP_CONFIG) {
        return window.APP_CONFIG.APP_INSTANCE ?? 'atlas'
    }
    return process.env.REACT_APP_APP_INSTANCE ?? 'atlas'
}
```

### A4 — Update `.env` and `.env.example`

In both files:

- **Add** `APP_INSTANCE=atlas` (or `REACT_APP_APP_INSTANCE=atlas`).
- **Remove** the five `REACT_APP_*_ENDPOINT` lines:
  - `REACT_APP_DATA_ENDPOINT`
  - `REACT_APP_SEARCH_ENDPOINT`
  - `REACT_APP_PIT_ENDPOINT`
  - `REACT_APP_SCROLL_ENDPOINT`
  - `REACT_APP_ARCHIVE_ENDPOINT`

These endpoint values now come from `getAppConfig()`.

### A5 — Update `src/core/constants.js` (lines 21–30)

Change the `endpoints` object to read from `getAppConfig()` instead of
`process.env`:

```js
import { getAppConfig } from './appConfig'

const config = getAppConfig()

export const endpoints = {
    data: config.dataEndpoint,
    search: config.searchEndpoint,
    pit: config.pitEndpoint,
    scroll: config.scrollEndpoint,
    archive: config.archiveEndpoint,
    mitm: `${publicUrl}/streamsaver/mitm.html`,
    pdsFieldSearch:
        'https://pds.nasa.gov/services/search/search?fq=product-class%3AProduct_Attribute_Definition&fq=attribute_name%3A{field}&wt=json',
}
```

All downstream consumers (`actions.js`, downloaders, `utils.js`, `Record.js`,
`Preview.js`, `AutocompleteMapping.js`) import from `endpoints` and need **no
changes**.

### A6 — Unit tests: `tests/unit/appConfig.test.js`

- Assert `getAppConfig()` returns the correct `atlas` config when no
  `APP_INSTANCE` is set (default).
- Assert `getAppConfig()` returns the correct `raws` config when
  `APP_INSTANCE=raws`.
- Assert **every field** listed in the schema above is present for both
  `atlas` and `raws` (no missing keys).
- Assert `getAllInstances()` returns an object with `atlas` and `raws` keys.

---

## Workstream B — Feature Toggles

> Run **4 parallel sub-agents** (B1–B4). Each touches different files/sections.
> All start after Workstream A merges.

### B1 — Cart toggle (`enableCart`)

Read `getAppConfig().enableCart` and conditionally render/register the cart:

| File | Lines | Change |
|---|---|---|
| `src/core/routes/routes.js` | 44 | Conditionally render `/cart` `<Route>` |
| `src/components/Topbar/index.js` | 281–294 | Conditionally render Cart `<IconButton>` |
| `src/components/Toolbar/Toolbar.js` | 249–255 | Conditionally include `Cart` entry in `drawerItems` |
| `scripts/start-prod.js` | 167 | Conditionally include `/cart` in `baseRoutes` |

**Tests:**
- Add tests to `tests/e2e/navigation/toolbar.spec.js` asserting Cart button
  visibility when `enableCart=true` and absence when `enableCart=false`.
- Add test asserting `/cart` route returns 200 for atlas.
- Update `tests/e2e/navigation/click-navigation.spec.js` (line 17),
  `tests/e2e/navigation/drawer-all-items.spec.js`, and
  `tests/e2e/mobile/workspace-switching.spec.js` to be conditioned on
  `enableCart` (skip or adjust assertions for raws).

### B2 — Archive Explorer toggle (`enableArchiveExplorer`)

Read `getAppConfig().enableArchiveExplorer` and conditionally render/register:

| File | Lines | Change |
|---|---|---|
| `src/core/routes/routes.js` | 45 | Conditionally render `/archive-explorer` `<Route>` |
| `src/components/Topbar/index.js` | 266–278 | Conditionally render Archive Explorer `<IconButton>` |
| `src/components/Toolbar/Toolbar.js` | 244–249 | Conditionally include `Browse Archive` in `drawerItems` |
| `src/components/Toolbar/Toolbar.js` | 446–472 | Conditionally render Archive Explorer toolbar section |
| `scripts/start-prod.js` | 167 | Conditionally include `/archive-explorer` and `/archive-explorer/*path` in `baseRoutes` |

**Tests:** Same pattern as B1 — visibility tests, conditioned existing tests.

### B3 — Map toggle (`enableMap`)

Read `getAppConfig().enableMap` and conditionally render:

| File | Lines | Change |
|---|---|---|
| `src/pages/Search/Search.js` | 57 | Conditionally render `<SecondaryPanel>` (mobile branch) |
| `src/pages/Search/Search.js` | 79 | Conditionally render `<SecondaryPanel>` (desktop branch) |
| `src/components/Toolbar/Toolbar.js` | 538–592 | Conditionally render Map Panel toggle button and switch |

**Tests:** Assert Map Panel button visibility is tied to `enableMap`.

### B4 — Add Filters button toggle (`enableAddFilters`)

Read `getAppConfig().enableAddFilters` and conditionally render:

| File | Lines | Change |
|---|---|---|
| `src/pages/Search/Panels/FiltersPanel/FiltersPanel.js` | 148–160 | Conditionally render the "Add" `<Button>` only when `enableAddFilters` is `true` |

**Tests:** Assert Add button presence/absence based on config.

---

## Workstream C — Behavioral Configuration

> Run **7 parallel sub-agents** (C1–C7). Each modifies a distinct concern.
> All start after Workstream A merges.

### C1 — Page title (`appTitle`)

Replace hardcoded "Atlas" in `document.title` and the `<h1>` with
`getAppConfig().appTitle`:

| File | Lines | Change |
|---|---|---|
| `src/pages/Search/Search.js` | 37 | `document.title = \`${getAppConfig().appTitle} - Search \| PDS-IMG\`` |
| `src/pages/Cart/Cart.js` | 20 | Same pattern |
| `src/pages/FileExplorer/FileExplorer.js` | 95 | Same pattern |
| `src/components/Topbar/index.js` | 219 | Replace `<h1>ATLAS</h1>` with `<h1>{getAppConfig().appTitle.toUpperCase()}</h1>` |

**Tests:** Assert page title contains expected app name for each instance.

### C2 — Default sort (`defaultSortField`, `defaultSortDirection`)

| File | Lines | Change |
|---|---|---|
| `src/core/redux/store/initial.js` | 100–104 | Read `field` and `direction` from `getAppConfig()` instead of hardcoding `'gather.time.start_time'` and `'desc'` |

**Tests:** Assert initial Redux state contains correct sort values per instance.

### C3 — Default download product (`defaultDownloadProduct`)

| File | Lines | Change |
|---|---|---|
| `src/pages/Record/Title/Title.js` | 194 | Use `getAppConfig().defaultDownloadProduct` instead of hardcoded `'src'` in `checked: key === 'src'` |
| `src/components/ProductDownloadSelector/ProductDownloadSelector.js` | 106–146 | Use config value for determining which product category is initially checked |

**Tests:** Assert correct default checked product per instance.

### C4 — About modal (`aboutTitle`, `aboutDescription`, `aboutContactUrl`)

| File | Lines | Change |
|---|---|---|
| `src/pages/Search/Modals/InformationModal/InformationModal.js` | 188 | Replace hardcoded `"Atlas"` title with `getAppConfig().aboutTitle` |
| Same file | 201–213 | Replace hardcoded description paragraph with `getAppConfig().aboutDescription` |
| Same file | 217–226 | Replace hardcoded contact section with config-driven link (`aboutContactUrl`); show feedback link when URL is empty, external link when URL is set |

**Tests:** Assert modal content matches config for each instance.

### C5 — Default filters (`defaultFilters`)

| File | Lines | Change |
|---|---|---|
| `src/facets/FacetBuilder.js` | 228–239 | Replace hardcoded `FILTER_ORDER_PRIORITY` with `getAppConfig().defaultFilters` |
| `src/facets/FacetBuilder.js` | 255–296 | `getInitialActiveFilters()` should iterate over `getAppConfig().defaultFilters` instead of the hardcoded set |

**Tests:** Assert initial active filters match config for each instance.

### C6 — Default filter values (`defaultFilterValues`)

| File | Lines | Change |
|---|---|---|
| `src/facets/FacetBuilder.js` | (within `getInitialActiveFilters`) | After building the initial filters map, apply default state values from `getAppConfig().defaultFilterValues` (e.g., set exclude lists) |
| `src/core/redux/actions/actions.js` | 162 | After dispatching `addActiveFilters` in `setMappings()`, apply default filter values from config |

**Tests:** Assert that `raws` instance starts with `product_type` excluding
`'Movie Frame'`.

### C7 — Endpoints migration

This is handled in Workstream A (step A5). The sub-agent for C7 should
**verify** the migration is complete by:

- Confirming `src/core/constants.js` reads from `getAppConfig()`.
- Confirming `REACT_APP_*_ENDPOINT` lines are removed from `.env` and
  `.env.example`.
- Writing `tests/e2e/search/endpoints.spec.js` — intercept network requests
  and assert the correct endpoint path is used (`/search/atlas/_search` vs
  `/search/raws/_search`) based on instance.

---

## Workstream D — Shared Main Menu Drawer

> Run **1 sub-agent**. Starts after Workstream A merges.

### D1 — Dynamic drawer items

| File | Lines | Change |
|---|---|---|
| `src/components/Toolbar/Toolbar.js` | 231–295 | Replace static `drawerItems` array with a `buildDrawerItems()` function |

The `buildDrawerItems()` function must:

1. Call `getAllInstances()` to get all registered instance configs.
2. Sort instances by `drawerOrder`.
3. For each instance, generate:
   - A header item (`{ name: instance.drawerLabel, isHeader: true }`).
   - Child items conditioned on that instance's feature flags:
     - "Search Images" (always present).
     - "Browse Archive" (only if `enableArchiveExplorer`).
     - "Cart" (only if `enableCart`, with `showLength: true`).
     - "Documentation" (always present, `openInNewTab: true`).
   - Items from **other** instances (non-empty `baseUrl`) are rendered as
     external links (full URL = `baseUrl + path`).
   - Items from the **current** instance use relative paths.
4. Append shared Data links after all instance sections:
   - "Data" header
   - Volumes (`https://pds-imaging.jpl.nasa.gov/volumes/`)
   - Holdings (`https://pds-imaging.jpl.nasa.gov/holdings/`)
   - Portal (`https://pds-imaging.jpl.nasa.gov/portal/`)
   - Release Calendar (`https://pds.nasa.gov/datasearch/subscription-service/data-release-calendar.shtml`)
   - Tools & Tutorials (`https://pds-imaging.jpl.nasa.gov/software/`)
   - Help (`https://pds-imaging.jpl.nasa.gov/help/help.html`)

**Tests:**
- Unit test asserting `buildDrawerItems()` output structure for both instances.
- E2e test asserting drawer contains expected sections.

---

## Consolidated field reference

Every instance config object **must** include all of these fields:

| Field | Type | Atlas value | Raws value |
|---|---|---|---|
| `appTitle` | `string` | `'Atlas'` | `'Planetary Raws'` |
| `enableCart` | `boolean` | `true` | `false` |
| `enableArchiveExplorer` | `boolean` | `true` | `false` |
| `enableMap` | `boolean` | `true` | `false` |
| `enableAddFilters` | `boolean` | `true` | `false` |
| `defaultDownloadProduct` | `string` | `'src'` | `'browse'` |
| `defaultSortField` | `string` | `'gather.time.start_time'` | `'gather.time.start_time'` |
| `defaultSortDirection` | `string` | `'desc'` | `'desc'` |
| `aboutTitle` | `string` | `'Atlas'` | `'Planetary Raws'` |
| `aboutDescription` | `string` | _(existing paragraph)_ | _(raws-specific paragraph)_ |
| `aboutContactUrl` | `string` | `''` | `'https://pds-imaging.jpl.nasa.gov/help/help.html'` |
| `defaultFilters` | `string[]` | _(10 filter keys)_ | _(6 filter keys)_ |
| `defaultFilterValues` | `object` | `{}` | `{ 'gather.common.product_type': { exclude: ['Movie Frame'] } }` |
| `drawerOrder` | `number` | `0` | `1` |
| `drawerLabel` | `string` | `'Atlas'` | `'Planetary Raws'` |
| `baseUrl` | `string` | `''` | `'https://pds-imaging.jpl.nasa.gov/tools/raws'` |
| `dataEndpoint` | `string` | `'/data'` | `'/data'` |
| `searchEndpoint` | `string` | `'/search/atlas/_search'` | `'/search/raws/_search'` |
| `pitEndpoint` | `string` | `'/search/atlas/_pit'` | `'/search/raws/_pit'` |
| `scrollEndpoint` | `string` | `'/search/_search/scroll'` | `'/search/_search/scroll'` |
| `archiveEndpoint` | `string` | `'/search/atlas/_search'` | `'/search/raws/_search'` |

---

## Dependency graph

```
                       ┌───────────┐
                       │ A: Config │
                       │ (1 agent) │
                       └─────┬─────┘
                             │ merge into main
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    ┌───────────────┐ ┌───────────────┐ ┌──────────┐
    │ B: Toggles    │ │ C: Behavior   │ │ D: Drawer│
    │ (4 agents)    │ │ (7 agents)    │ │ (1 agent)│
    │ B1 Cart       │ │ C1 Title      │ └──────────┘
    │ B2 Archive    │ │ C2 Sort       │
    │ B3 Map        │ │ C3 Download   │
    │ B4 AddFilters │ │ C4 About      │
    └───────────────┘ │ C5 Filters    │
                      │ C6 FilterVals │
                      │ C7 Endpoints  │
                      └───────────────┘
```

## Notes

- **Existing tests must not break.** If an existing test asserts behaviour
  that is now config-dependent, condition it on the active instance rather
  than deleting it.
- **Lint must pass** (`npm run lint`) in every sub-agent before pushing.
- All sub-agents should follow the project's existing code style — MUI 5
  with `makeStyles`, Redux via `useSelector`/`useDispatch`, no TypeScript.
- Read `AGENTS.md` for selector strategy, download safety rules, and
  architecture context before writing tests.
