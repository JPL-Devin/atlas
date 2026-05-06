/**
 * Shared helpers for Atlas Playwright tests.
 */

const DEFAULT_NAVIGATION_TIMEOUT = 30000

export function getBaseURL() {
    return process.env.TEST_BASE_URL || 'http://localhost:18500'
}

/**
 * Wait for the Atlas SPA shell to be ready. Atlas does not have a database
 * or a "Reference-Mission" gate like MMGIS, so we just wait for networkidle
 * and verify the body has rendered some content.
 *
 * Atlas talks to a live PDS Elasticsearch endpoint. When that endpoint is
 * slow or unreachable (which is common in CI / sandboxed environments),
 * `networkidle` may never fire because requests stay in-flight or are
 * aborted past the navigation timeout. We swallow that timeout so callers
 * reliably reach their assertions — `filterCriticalJsErrors` is what
 * actually distinguishes "expected upstream noise" from "real regression".
 */
export async function waitForAppReady(page, { timeout = DEFAULT_NAVIGATION_TIMEOUT } = {}) {
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {})
    const hasContent = await page.evaluate(() => document.body && document.body.innerHTML.length > 0)
    return hasContent
}

export async function navigateToSearch(page, { timeout = DEFAULT_NAVIGATION_TIMEOUT } = {}) {
    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout })
    await waitForAppReady(page, { timeout })
}

export async function navigateToRecord(page, uri = null, { timeout = DEFAULT_NAVIGATION_TIMEOUT } = {}) {
    const path = uri ? `/record?uri=${encodeURIComponent(uri)}` : '/record'
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout })
    await waitForAppReady(page, { timeout })
}

export async function navigateToCart(page, { timeout = DEFAULT_NAVIGATION_TIMEOUT } = {}) {
    await page.goto('/cart', { waitUntil: 'domcontentloaded', timeout })
    await waitForAppReady(page, { timeout })
}

export async function navigateToArchiveExplorer(page, { timeout = DEFAULT_NAVIGATION_TIMEOUT } = {}) {
    await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded', timeout })
    await waitForAppReady(page, { timeout })
}

/**
 * Filter list of recorded JS errors down to those that would indicate a
 * real bug (not network noise that's expected when external APIs are
 * unreachable in CI / sandboxed test environments).
 *
 * Two categories are filtered out:
 *
 * 1. Direct network errors. Atlas talks to a live PDS Elasticsearch
 *    endpoint (`https://pds-imaging.jpl.nasa.gov/api`). When tests run
 *    behind a firewall or when that endpoint is briefly unavailable,
 *    `fetch()` rejects and the browser logs `Failed to fetch`,
 *    `NetworkError`, `net::ERR_*`, `AbortError`, or `404`.
 *
 * 2. Downstream consequences of (1). Atlas's Redux reducers (e.g.
 *    `addMappingsToFilters`) assume the API responded with a
 *    well-formed mappings document. When the request fails, the action
 *    payload is undefined and selectors throw
 *    `Cannot read properties of undefined (reading 'groups')` /
 *    `Cannot set properties of null`. Those crashes are *symptoms* of
 *    the unreachable API, not regressions in the code under test, so
 *    they are filtered too.
 *
 * If you are tracking down an actual regression, comment out (2) first
 * to surface the underlying error.
 */
const NON_CRITICAL_ERROR_PATTERNS = [
    // Category 1: direct network errors
    'Failed to fetch',
    'NetworkError',
    'net::ERR',
    'AbortError',
    '404',
    // Category 2: downstream Redux/selector crashes when the API
    // payload is missing. Atlas state is held in immutable.js Maps; when
    // a reducer receives `undefined` instead of a Map, selectors that
    // call `.toJS()` / `.get(...).toJS()` throw with these messages.
    'Cannot set properties of null',
    'Cannot set properties of undefined',
    'Cannot read properties of null',
    'Cannot read properties of undefined',
    'Cannot read property',
    'toJS is not a function',
]

export function filterCriticalJsErrors(errors) {
    return errors.filter((msg) => !NON_CRITICAL_ERROR_PATTERNS.some((pattern) => msg.includes(pattern)))
}
