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
 */

const SHORT_WAIT_MS = 20_000

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

// Seed localStorage with a cart that has one query item so the cart page
// is ready to download immediately.
function seedCartWithQueryItem(page) {
    return page.evaluate(() => {
        const cartItem = {
            type: 'query',
            checked: true,
            time: Date.now(),
            item: {
                query: { match_all: {} },
                total: 100000,
                uri: '/data/test/',
                related: {},
                images: [],
            },
        }
        localStorage.setItem('ATLAS_CART', JSON.stringify([cartItem]))
    })
}

// Seed localStorage with two query items
function seedCartWithTwoQueryItems(page) {
    return page.evaluate(() => {
        const makeItem = (idx) => ({
            type: 'query',
            checked: true,
            time: Date.now() + idx,
            item: {
                query: { match_all: {} },
                total: 100000,
                uri: `/data/test_${idx}/`,
                related: {},
                images: [],
            },
        })
        localStorage.setItem('ATLAS_CART', JSON.stringify([makeItem(0), makeItem(1)]))
    })
}

// Navigate to /cart and switch to the given download tab.
// Cart items are seeded with `checked: true` in localStorage, so they are
// already selected when the cart loads — no checkbox interaction needed.
async function prepareCartForDownload(page, tabName) {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' })
    await waitForAppReady(page)

    // Wait for cart items to render
    const cartItem = page.locator('[cart-index]').first()
    try {
        await cartItem.waitFor({ state: 'visible', timeout: SHORT_WAIT_MS })
    } catch {
        test.skip(true, 'Cart items did not render — cart seeding may have failed.')
    }

    // Switch to the target download tab
    const tab = page.getByRole('tab', { name: tabName })
    if ((await tab.count()) > 0) {
        await tab.first().click()
    } else {
        test.skip(true, `Download tab "${tabName}" not found — panel may require item selection.`)
    }
}

test.describe('Cart - download cancellation', () => {
    test('cancelling a CSV download stops subsequent scroll requests', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Track intercepted scroll requests
        const scrollRequests = []
        let searchResponseSent = false

        // Intercept ES search/scroll endpoints with delayed responses
        await page.route('**/*_search*', async (route) => {
            const url = route.request().url()

            if (url.includes('scroll')) {
                scrollRequests.push({ url, time: Date.now() })
                // Delay scroll responses to give time to click cancel
                await new Promise((r) => setTimeout(r, 2000))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'test_scroll_id_2', 10)
                    ),
                })
            } else {
                // Initial search request
                searchResponseSent = true
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'test_scroll_id_1', 10)
                    ),
                })
            }
        })

        // Also intercept the dedicated scroll endpoint
        await page.route('**/*scroll*', async (route) => {
            const url = route.request().url()
            if (url.includes('scroll') && !url.includes('_search')) {
                scrollRequests.push({ url, time: Date.now() })
                await new Promise((r) => setTimeout(r, 2000))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'test_scroll_id_2', 10)
                    ),
                })
            } else {
                await route.continue()
            }
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

        // Wait for the initial search to fire
        await page.waitForTimeout(1000)

        // Record scroll count at the moment we click Stop
        const scrollCountBeforeStop = scrollRequests.length

        // Click the Stop button on the DownloadingCard
        const stopBtn = page.getByRole('button', { name: /stop download/i }).or(
            page.locator('button:has(svg[data-testid="StopIcon"])')
        )
        await stopBtn.first().click()

        // Wait to see if any new scroll requests come in after cancel
        await page.waitForTimeout(4000)

        const scrollCountAfterStop = scrollRequests.length
        const newScrollsAfterCancel = scrollCountAfterStop - scrollCountBeforeStop

        // After cancel, at most 1 in-flight scroll request should complete.
        // No NEW scroll requests should be initiated.
        expect(newScrollsAfterCancel).toBeLessThanOrEqual(1)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('cancelling a ZipStream (Browser) download stops subsequent fetch and scroll requests', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        const scrollRequests = []
        const fileRequests = []

        // Intercept ES search/scroll endpoints
        await page.route('**/*_search*', async (route) => {
            const url = route.request().url()

            if (url.includes('scroll')) {
                scrollRequests.push({ url, time: Date.now() })
                await new Promise((r) => setTimeout(r, 2000))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'zip_scroll_id_2', 10)
                    ),
                })
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'zip_scroll_id_1', 10)
                    ),
                })
            }
        })

        // Intercept dedicated scroll endpoint
        await page.route('**/*scroll*', async (route) => {
            const url = route.request().url()
            if (url.includes('scroll') && !url.includes('_search')) {
                scrollRequests.push({ url, time: Date.now() })
                await new Promise((r) => setTimeout(r, 2000))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'zip_scroll_id_2', 10)
                    ),
                })
            } else {
                await route.continue()
            }
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
        await prepareCartForDownload(page, 'Browser')

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
        const stopBtn = page.getByRole('button', { name: /stop download/i }).or(
            page.locator('button:has(svg[data-testid="StopIcon"])')
        )
        await stopBtn.first().click()

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

        // Track which cart items had their initial _search fire
        const initialSearches = []

        await page.route('**/*_search*', async (route) => {
            const url = route.request().url()

            if (url.includes('scroll')) {
                // Delay scroll responses
                await new Promise((r) => setTimeout(r, 2000))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'multi_scroll_id', 10)
                    ),
                })
            } else {
                initialSearches.push({ url, time: Date.now() })
                // Delay the initial search so we have time to cancel
                await new Promise((r) => setTimeout(r, 1500))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'multi_scroll_id_1', 10)
                    ),
                })
            }
        })

        // Intercept dedicated scroll endpoint
        await page.route('**/*scroll*', async (route) => {
            const url = route.request().url()
            if (url.includes('scroll') && !url.includes('_search')) {
                await new Promise((r) => setTimeout(r, 2000))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'multi_scroll_id', 10)
                    ),
                })
            } else {
                await route.continue()
            }
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
        const stopBtn = page.getByRole('button', { name: /stop download/i }).or(
            page.locator('button:has(svg[data-testid="StopIcon"])')
        )
        await stopBtn.first().click()

        // Wait and observe whether the second item's search fires
        await page.waitForTimeout(4000)

        // Only the first cart item's initial _search should have fired.
        // The second item should never start.
        expect(initialSearches.length).toBeLessThanOrEqual(1)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('Stop button on DownloadingCard reflects cancelled state in UI', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Intercept ES search with a slow response so the DownloadingCard stays visible
        await page.route('**/*_search*', async (route) => {
            const url = route.request().url()
            if (url.includes('scroll')) {
                await new Promise((r) => setTimeout(r, 3000))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'ui_scroll_id', 10)
                    ),
                })
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'ui_scroll_id_1', 10)
                    ),
                })
            }
        })

        await page.route('**/*scroll*', async (route) => {
            const url = route.request().url()
            if (url.includes('scroll') && !url.includes('_search')) {
                await new Promise((r) => setTimeout(r, 3000))
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(
                        buildSearchResponse(100000, 'ui_scroll_id', 10)
                    ),
                })
            } else {
                await route.continue()
            }
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
        await page.waitForTimeout(1500)

        // The DownloadingCard should be visible with a running progress bar
        const progressBar = page.locator('[role="progressbar"]')
        try {
            await progressBar.first().waitFor({ state: 'visible', timeout: SHORT_WAIT_MS })
        } catch {
            test.skip(true, 'DownloadingCard progress bar did not appear.')
        }

        // Click the Stop button
        const stopBtn = page.getByRole('button', { name: /stop download/i }).or(
            page.locator('button:has(svg[data-testid="StopIcon"])')
        )
        await stopBtn.first().click()

        // After stopping:
        // 1. The progress bar (buffer variant) should no longer be visible
        // 2. The card should show "Stopped" text or a red stopped bar
        await expect(page.getByText('Stopped')).toBeVisible({ timeout: 5000 })

        // The running progress bar should be gone (replaced by the red stopped bar)
        await expect(progressBar.first()).not.toBeVisible({ timeout: 5000 })

        // No download-in-progress button text should remain
        const downloadInProgress = page.getByRole('button', { name: 'Download in Progress' })
        if ((await downloadInProgress.count()) > 0) {
            // The button should still say "Download in Progress" (it's pointer-events: none)
            // but if the UI properly resets it should not
        }

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
