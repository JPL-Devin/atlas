import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Filter preservation across /search → /record → back.
 *
 * `refresh-preservation.spec.js` covers a hard reload of /search.
 * This spec covers the SPA-internal round trip:
 *
 *   1. User lands on /search (with whatever the SPA settles on).
 *   2. User clicks a result, lands on /record?uri=…
 *   3. User clicks "return to search" (or browser back).
 *   4. The /search URL the SPA settled on initially must be exactly
 *      the same — filters/sort/etc all preserved.
 *
 * If the SPA wipes filter state on back-navigation that's a UX
 * regression. This is a pure URL-equality check on the post-settle
 * /search URL.
 *
 * Live API dependency: needs /search to return at least one result
 * so we can navigate to /record. Self-skips if not.
 */

const SHORT_RESULT_WAIT_MS = 20_000

test.describe('Navigation - search → record → back preserves /search URL', () => {
    test('round-tripping to /record and back preserves the settled /search URL', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const firstCard = page.locator('[result-id]').first()
        try {
            await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        } catch {
            test.skip(true, 'Upstream Atlas API not returning results in this environment')
        }

        const settledSearchURL = page.url()

        await firstCard.click()
        await page.waitForURL(/\/record\?uri=/, { timeout: SHORT_RESULT_WAIT_MS })
        await waitForAppReady(page)

        // Browser back returns to /search with the same URL.
        await page.goBack()
        await page.waitForURL(/\/search/, { timeout: SHORT_RESULT_WAIT_MS })
        await waitForAppReady(page)

        expect(page.url()).toBe(settledSearchURL)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
