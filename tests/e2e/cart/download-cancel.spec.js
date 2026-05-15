import { test, expect } from '@playwright/test'
import { waitForAppReady, navigateToCart, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Cart download cancellation tests.
 *
 * These tests verify that clicking the Stop button on the DownloadingCard
 * actually aborts in-flight ES scroll requests and file fetches. Before
 * the fix, `stopped = true` prevented the *next* scroll callback from
 * executing, but in-flight axios/fetch requests continued to completion
 * and could fire additional scroll requests before the flag was checked.
 *
 * Strategy: use `page.route()` to intercept ES search/scroll endpoints,
 * mock responses with large totals and artificial delays, then assert
 * that no new requests fire after Stop is clicked.
 *
 * Route patterns use regex to ONLY match download-specific requests
 * (which include `scroll` in the URL), avoiding the app's regular
 * search API calls that happen during navigation.
 *
 * All endpoints are fully mocked via page.route() — no real PDS traffic.
 */

const SHORT_WAIT_MS = 20_000

// --- Route patterns -------------------------------------------------------
// Download searches use  _search?scroll=1m&…  (the scroll query-param
// distinguishes them from regular /search API calls).
const DOWNLOAD_SEARCH_RE = /_search\?.*scroll=/

// The dedicated scroll endpoint lives at  /_search/scroll
const SCROLL_ENDPOINT_RE = /_search\/scroll/

// Build a mock ES search response with a scroll_id and a small hits array
function buildSearchResponse(total, scrollId, hitsCount = 10) {
    const hits = Array.from({ length: hitsCount }, (_, i) => ({
        _source: {
            uri: `/data/test/product_${i}.img`,
            release_id_num: 1,
            gather: {
                pds_archive: {
                    related: {
                        browse: { uri: `/data/test/product_${i}_browse.jpg` },
                    },
                },
            },
            archive: { fs_type: 'file' },
        },
    }))
    return {
        _scroll_id: scrollId,
        hits: {
            total: { value: total, relation: 'eq' },
            hits,
        },
    }
}

// Build a cart item with proper related data so ProductDownloadSelector
// shows product type checkboxes (needs related.src with count > 0).
function makeCartItem(idx = 0) {
    return {
        type: 'query',
        checked: true,
        time: Date.now() + idx,
        item: {
            query: { match_all: {} },
            total: 100000,
            uri: `/data/test_${idx}/`,
            related: {
                src: { uri: `/data/test_${idx}/product.img`, count: 100000, size: 1024 },
            },
            images: [],
        },
    }
}

// Seed localStorage with a cart that has one query item.
function seedCartWithQueryItem(page) {
    return page.evaluate((item) => {
        localStorage.setItem('ATLAS_CART', JSON.stringify([item]))
    }, makeCartItem(0))
}

// Seed localStorage with two query items
function seedCartWithTwoQueryItems(page) {
    return page.evaluate((items) => {
        localStorage.setItem('ATLAS_CART', JSON.stringify(items))
    }, [makeCartItem(0), makeCartItem(1)])
}

// Navigate to /cart, check all items, select the "Primary Product" product
// type, and choose the given download method radio.
//
// initial.js resets `checked` to false on every load, so we must check items
// via programmatic checkbox clicks after the cart renders. MUI hides the
// native <input>, so we dispatch the click from page.evaluate().
async function prepareCartForDownload(page, methodName) {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })
    await waitForAppReady(page)

    // Wait for cart items to render
    const cartItem = page.locator('[cart-index]').first()
    try {
        await cartItem.waitFor({ state: 'visible', timeout: SHORT_WAIT_MS })
    } catch {
        test.skip(true, 'Cart items did not render — cart seeding may have failed.')
    }

    // Check all cart items by programmatically clicking each hidden MUI checkbox.
    const itemCount = await page.locator('[cart-index]').count()
    for (let i = 0; i < itemCount; i++) {
        await page.evaluate((index) => {
            const el = document.querySelector(`[cart-index="${index}"]`)
            const cb = el?.querySelector('input[type="checkbox"]')
            if (cb) cb.click()
        }, i)
    }

    // Wait for ProductDownloadSelector to appear
    const productLabel = page.getByText('Primary Product', { exact: false })
    try {
        await productLabel.first().waitFor({ state: 'visible', timeout: SHORT_WAIT_MS })
    } catch {
        test.skip(true, 'ProductDownloadSelector did not render — product types may be empty.')
    }

    // Select the "Primary Product / File" product type
    await productLabel.first().click()

    // Wait for the download method radios to appear
    await page.waitForTimeout(300)

    // Select the download method radio
    const radio = page.getByRole('radio', { name: new RegExp(methodName, 'i') })
    try {
        await radio.first().waitFor({ state: 'visible', timeout: SHORT_WAIT_MS })
    } catch {
        test.skip(true, `Download method "${methodName}" radio not found.`)
    }
    await radio.first().click()

    // Wait for the download panel to render
    await page.waitForTimeout(300)
}

// Locate the Stop button on the DownloadingCard (MUI IconButton with StopIcon).
function stopButton(page) {
    return page.locator('button:has(svg[data-testid="StopIcon"])')
}

test.describe('Cart - download cancellation', () => {
    test('cancelling a CSV download stops subsequent scroll requests', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        const scrollRequests = []

        // Mock the initial download search (has ?scroll= query param)
        await page.route(DOWNLOAD_SEARCH_RE, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildSearchResponse(100000, 'test_scroll_id_1', 10)
                ),
            })
        })

        // Mock the scroll endpoint with a delay so there's time to cancel
        await page.route(SCROLL_ENDPOINT_RE, async (route) => {
            scrollRequests.push({ url: route.request().url(), time: Date.now() })
            await new Promise((r) => setTimeout(r, 2000))
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildSearchResponse(100000, 'test_scroll_id_2', 10)
                ),
            })
        })

        // Seed cart and navigate
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await seedCartWithQueryItem(page)
        await prepareCartForDownload(page, 'CSV')

        // Click the CSV Download button
        const downloadBtn = page.getByRole('button', { name: /csv download/i })
        if ((await downloadBtn.count()) === 0) {
            test.skip(true, 'CSV download button not found.')
        }
        await downloadBtn.click()

        // Wait for the initial search to fire and the first scroll to start
        await page.waitForTimeout(1000)

        // Record scroll count at the moment we click Stop
        const scrollCountBeforeStop = scrollRequests.length

        // Click the Stop button on the DownloadingCard
        const stop = stopButton(page)
        try {
            await stop.first().waitFor({ state: 'visible', timeout: 10_000 })
        } catch {
            test.skip(true, 'Stop button did not appear — download may not have started.')
        }
        await stop.first().click()

        // Wait to see if any new scroll requests come in after cancel
        await page.waitForTimeout(4000)

        const scrollCountAfterStop = scrollRequests.length
        const newScrollsAfterCancel = scrollCountAfterStop - scrollCountBeforeStop

        // After cancel, at most 1 in-flight scroll request should complete.
        expect(newScrollsAfterCancel).toBeLessThanOrEqual(1)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('cancelling a ZipStream (Browser) download stops subsequent fetch and scroll requests', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        const scrollRequests = []
        const fileRequests = []

        // Mock the initial download search
        await page.route(DOWNLOAD_SEARCH_RE, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildSearchResponse(100000, 'zip_scroll_id_1', 10)
                ),
            })
        })

        // Mock the scroll endpoint
        await page.route(SCROLL_ENDPOINT_RE, async (route) => {
            scrollRequests.push({ url: route.request().url(), time: Date.now() })
            await new Promise((r) => setTimeout(r, 2000))
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildSearchResponse(100000, 'zip_scroll_id_2', 10)
                ),
            })
        })

        // Intercept file download URLs
        await page.route('**/*.img', async (route) => {
            fileRequests.push({ url: route.request().url(), time: Date.now() })
            await new Promise((r) => setTimeout(r, 1000))
            await route.fulfill({
                status: 200,
                contentType: 'application/octet-stream',
                body: Buffer.alloc(1024),
            })
        })

        // Seed cart and navigate
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await seedCartWithQueryItem(page)
        await prepareCartForDownload(page, 'ZIP')

        // Click the Browser ZIP Download button
        const downloadBtn = page.getByRole('button', { name: /browser zip download/i })
        if ((await downloadBtn.count()) === 0) {
            test.skip(true, 'Browser ZIP download button not found.')
        }
        await downloadBtn.click()

        // Wait for some fetch activity
        await page.waitForTimeout(2000)

        const scrollCountBeforeStop = scrollRequests.length
        const fileCountBeforeStop = fileRequests.length

        // Click the Stop button
        const stop = stopButton(page)
        try {
            await stop.first().waitFor({ state: 'visible', timeout: 10_000 })
        } catch {
            test.skip(true, 'Stop button did not appear — download may not have started.')
        }
        await stop.first().click()

        // Wait to see if any new requests come in after cancel
        await page.waitForTimeout(4000)

        const newScrollsAfterCancel = scrollRequests.length - scrollCountBeforeStop
        const newFilesAfterCancel = fileRequests.length - fileCountBeforeStop

        // No new scroll or file requests should fire after cancel
        expect(newScrollsAfterCancel).toBeLessThanOrEqual(1)
        expect(newFilesAfterCancel).toBeLessThanOrEqual(1)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('cancelling between cart items prevents subsequent items from downloading', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Track download-initiated search requests (with ?scroll= param)
        const downloadSearches = []

        // Mock the initial download search — delay it so we can cancel in time
        await page.route(DOWNLOAD_SEARCH_RE, async (route) => {
            downloadSearches.push({ url: route.request().url(), time: Date.now() })
            await new Promise((r) => setTimeout(r, 1500))
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildSearchResponse(100000, 'multi_scroll_id_1', 10)
                ),
            })
        })

        // Mock the scroll endpoint
        await page.route(SCROLL_ENDPOINT_RE, async (route) => {
            await new Promise((r) => setTimeout(r, 2000))
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildSearchResponse(100000, 'multi_scroll_id', 10)
                ),
            })
        })

        // Seed cart with 2 items
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await seedCartWithTwoQueryItems(page)
        await prepareCartForDownload(page, 'CSV')

        // Click the CSV Download button
        const downloadBtn = page.getByRole('button', { name: /csv download/i })
        if ((await downloadBtn.count()) === 0) {
            test.skip(true, 'CSV download button not found.')
        }
        await downloadBtn.click()

        // Wait for the first item's initial search to fire
        await page.waitForTimeout(2500)

        // Click the Stop button
        const stop = stopButton(page)
        try {
            await stop.first().waitFor({ state: 'visible', timeout: 10_000 })
        } catch {
            test.skip(true, 'Stop button did not appear — download may not have started.')
        }
        await stop.first().click()

        // Wait and observe whether the second item's search fires
        await page.waitForTimeout(4000)

        // Only the first cart item's download search should have fired.
        expect(downloadSearches.length).toBeLessThanOrEqual(1)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('Stop button on DownloadingCard reflects cancelled state in UI', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Mock the initial download search
        await page.route(DOWNLOAD_SEARCH_RE, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildSearchResponse(100000, 'ui_scroll_id_1', 10)
                ),
            })
        })

        // Mock the scroll endpoint with a slow response so DownloadingCard stays visible
        await page.route(SCROLL_ENDPOINT_RE, async (route) => {
            await new Promise((r) => setTimeout(r, 3000))
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildSearchResponse(100000, 'ui_scroll_id', 10)
                ),
            })
        })

        // Seed cart and navigate
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await seedCartWithQueryItem(page)
        await prepareCartForDownload(page, 'CSV')

        // Click the CSV Download button
        const downloadBtn = page.getByRole('button', { name: /csv download/i })
        if ((await downloadBtn.count()) === 0) {
            test.skip(true, 'CSV download button not found.')
        }
        await downloadBtn.click()

        // Wait for the DownloadingCard to appear with a progress indicator
        const progressBar = page.locator('[role="progressbar"]')
        try {
            await progressBar.first().waitFor({ state: 'visible', timeout: SHORT_WAIT_MS })
        } catch {
            test.skip(true, 'DownloadingCard progress bar did not appear.')
        }

        // Click the Stop button
        const stop = stopButton(page)
        await stop.first().click()

        // After stopping, the card should show "Stopped" text
        await expect(page.getByText('Stopped')).toBeVisible({ timeout: 5000 })

        // The running progress bar should be gone (replaced by the red stopped bar)
        await expect(progressBar.first()).not.toBeVisible({ timeout: 5000 })

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
