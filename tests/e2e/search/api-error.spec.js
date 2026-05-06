import { test, expect } from '@playwright/test'
import { waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * API error / network failure handling.
 *
 * Atlas talks to a live PDS Elasticsearch endpoint. The suite filters
 * "Failed to fetch" / "Cannot read properties of undefined" downstream
 * crashes by default (see filterCriticalJsErrors in atlas-helpers.js).
 * What we actually want to verify here is that:
 *
 *   1. Forcing the upstream API to return 5xx does not white-screen
 *      the SPA shell. The Toolbar / Topbar must remain interactive.
 *   2. The user can still navigate to other routes (/cart,
 *      /archive-explorer) even while /search's API is failing.
 *
 * We deliberately *don't* assert against `filterCriticalJsErrors`
 * here — that helper is built around exactly the network/Redux noise
 * we are intentionally generating.
 */

test.describe('Search - API error handling', () => {
    test('forcing _search to 500 does not white-screen the SPA shell', async ({ page }) => {
        await page.route(/_search/, async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'forced 500 for test', status: 500 }),
            })
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // Topbar and Toolbar must still be reachable even though the
        // search API is failing.
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        await expect(page.getByRole('button', { name: /go to cart/i })).toBeVisible()

        // Body has rendered content (no white screen).
        const bodyHasContent = await page.evaluate(
            () => document.body && document.body.innerHTML.length > 100,
        )
        expect(bodyHasContent).toBeTruthy()
    })

    test('user can still navigate to /cart while /search API is failing', async ({ page }) => {
        await page.route(/_search/, async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'forced 500 for test', status: 500 }),
            })
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // The Topbar cart button is the most reliable click-nav target.
        await page.getByRole('button', { name: /go to cart/i }).click()
        await page.waitForURL((u) => u.pathname.includes('/cart'), { timeout: 30_000 })
        expect(page.url()).toContain('/cart')

        // /cart route renders normally — its own UI does not depend on
        // the broken _search endpoint.
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
    })

    test('forcing _search to a network error does not crash the SPA shell', async ({ page }) => {
        // Simulate a hard network failure (DNS / connection reset).
        await page.route(/_search/, async (route) => {
            await route.abort('failed')
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        await expect(page.getByRole('button', { name: /go to cart/i })).toBeVisible()
    })
})
