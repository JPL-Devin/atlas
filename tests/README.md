# Atlas Testing Documentation

This directory contains the Playwright E2E test suite for Atlas. The
suite runs against the production Express server (`scripts/start-prod.js`)
serving the built React app from `build/atlas/`.

Atlas does not use a database — there is no DB seeding, mission setup, or
authentication flow to manage. The test infrastructure is therefore much
simpler than MMGIS's: Playwright's built-in `webServer` option starts and
tears down the server automatically, and `tests/global-setup.js` only
needs to ensure the production build exists.

## Test Structure

```
tests/
├── e2e/
│   ├── smoke.spec.js                # End-to-end smoke checks
│   ├── startup/
│   │   └── server-health.spec.js    # /_health, /robots.txt, root redirect
│   ├── search/
│   │   ├── search-page.spec.js      # Search route container + panels
│   │   ├── filters-panel.spec.js    # FiltersPanel rendering
│   │   └── results-panel.spec.js    # ResultsPanel rendering
│   ├── record/
│   │   └── record-page.spec.js      # /record route
│   ├── cart/
│   │   └── cart-page.spec.js        # /cart route
│   ├── archive-explorer/
│   │   └── file-explorer.spec.js    # /archive-explorer (FileX)
│   ├── navigation/
│   │   ├── routing.spec.js          # All four routes load without crashing
│   │   └── toolbar.spec.js          # Toolbar rendering / links
│   ├── performance/
│   │   └── page-load.spec.js        # Page load timing, JS heap, error count
│   ├── accessibility/
│   │   └── basic-a11y.spec.js       # Title, headings, focusable elements
│   ├── mobile/
│   │   └── responsive.spec.js       # Mobile viewport (375x667)
│   └── security/
│       └── headers.spec.js          # HSTS, x-powered-by, CSP, server hdr
├── helpers/
│   └── atlas-helpers.js             # Navigation helpers + JS-error filter
├── fixtures/
│   └── search-params.js             # Sample queries / record URIs
├── global-setup.js                  # Ensures build/atlas/ exists
└── README.md
```

## Prerequisites

- Node.js v22+
- Playwright browsers: `npx playwright install --with-deps chromium`

The test infrastructure automatically:

1. Runs `npm run build` if `build/atlas/` does not already exist
   (handled by `tests/global-setup.js`).
2. Starts the production Express server on **port 18500** with
   `PUBLIC_URL=''` and `DISABLE_CSP=true` (handled by Playwright's
   `webServer` option in `playwright.config.js`).
3. Tears the server down after tests complete.

Atlas has no database — no DB credentials, migrations, or seeding are
required. This is the main reason the setup is much lighter than
MMGIS's.

## Running Tests

### All tests
```bash
npm run test:e2e
```

### Targeted suites
```bash
npm run test:e2e:smoke           # Smoke tests only
npm run test:e2e:startup         # Server health / robots / redirect
npm run test:e2e:search          # Search page tests
npm run test:e2e:record          # Record page tests
npm run test:e2e:cart            # Cart page tests
npm run test:e2e:archive         # Archive explorer tests
npm run test:e2e:navigation      # Routing + toolbar tests
npm run test:e2e:performance     # Page load performance
npm run test:e2e:security        # Security header tests
npm run test:e2e:accessibility   # Basic a11y checks
npm run test:e2e:mobile          # Mobile / responsive
```

### Utilities
```bash
npm run test:e2e:headed          # Run with a visible browser window
npm run test:e2e:debug           # Open Playwright Inspector
npm run test:e2e:ui              # Open Playwright UI mode
npm run test:e2e:report          # Show the last HTML report
```

## Test Configuration

Configured in `playwright.config.js`:

| Setting    | Value                                                          |
|------------|----------------------------------------------------------------|
| Base URL   | `http://localhost:18500` (overridable via `TEST_BASE_URL`)     |
| Test port  | `18500`                                                        |
| Browsers   | Chromium (primary), Firefox (cross-browser only)               |
| Timeout    | 2 minutes per test                                             |
| Retries    | 2 in CI, 0 locally                                             |
| Reporters  | HTML, JSON, JUnit, List                                        |

Port 18500 is intentionally different from the default dev port (8500)
so a running dev server doesn't collide with the test server.

## How the Test Server is Configured

`playwright.config.js` runs the production server with these env overrides:

```js
{
  NODE_ENV: 'production',
  PORT: '18500',
  PUBLIC_URL: '',
  DISABLE_CSP: 'true',
  REACT_APP_DOMAIN: process.env.REACT_APP_DOMAIN || 'https://pds-imaging.jpl.nasa.gov/api',
}
```

`PUBLIC_URL=''` ensures the SPA is served from the root path (`/search`,
`/record`, …). `DISABLE_CSP=true` removes the strict CSP so test
assertions and inline assets work cleanly.

## External API Dependency

Atlas pulls all search results, record metadata, and archive listings
from a NASA PDS Elasticsearch endpoint (default
`https://pds-imaging.jpl.nasa.gov/api`). When that endpoint is not
reachable from the test environment (sandboxed CI, offline dev box), any
test that asserts on actual result data will see empty / failed
responses.

Tests in this suite are written defensively:

- The smoke / structural tests only assert that the SPA shell renders
  (no result-data assertions).
- Tests that explicitly require live data wrap their assertions in
  try/catch and call `test.skip()` when the API is unreachable.
- Page-error guards filter out `Failed to fetch`, `NetworkError`,
  `net::ERR_*`, and `404` so transient external API failures don't fail
  unrelated tests. See `filterCriticalJsErrors()` in
  `tests/helpers/atlas-helpers.js`.

## Debugging Tips

- Run with `npm run test:e2e:headed` to see the browser.
- Run a single test file: `npx playwright test tests/e2e/search/search-page.spec.js`.
- Inspect failures with the HTML report: `npm run test:e2e:report`.
- Traces are recorded on the first retry (`use.trace: 'on-first-retry'`).
- Screenshots and videos are kept only on failure.
- If the server fails to start, check that the build directory exists
  (`build/atlas/`). Delete it and rerun to force a rebuild.
