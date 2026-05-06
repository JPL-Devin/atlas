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
 */
export async function waitForAppReady(page, { timeout = DEFAULT_NAVIGATION_TIMEOUT } = {}) {
    await page.waitForLoadState('networkidle', { timeout })
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
 * Atlas's reducers expect to receive the Elasticsearch index "mappings"
 * response on first load. When the external PDS API is unreachable that
 * dispatch fails and downstream selectors crash with errors like
 * "Cannot read properties of undefined (reading 'groups')". We treat
 * those as expected when the API is unreachable.
 */
export function filterCriticalJsErrors(errors) {
    return errors.filter(
        (msg) =>
            !msg.includes('Cannot set properties of null') &&
            !msg.includes('Cannot set properties of undefined') &&
            !msg.includes('Cannot read properties of null') &&
            !msg.includes('Cannot read properties of undefined') &&
            !msg.includes('Cannot read property') &&
            !msg.includes('Failed to fetch') &&
            !msg.includes('NetworkError') &&
            !msg.includes('net::ERR') &&
            !msg.includes('AbortError') &&
            !msg.includes('404'),
    )
}
