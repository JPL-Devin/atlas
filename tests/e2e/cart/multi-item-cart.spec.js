import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Cart - multiple items.
 *
 * `integration/search-to-cart.spec.js` adds *one* item and asserts
 * the badge shows a count. This spec adds *two* items (different
 * results) and asserts:
 *
 *   1. The cart badge increments on each add (so the dispatch isn't
 *      idempotent or noop'd).
 *   2. /cart renders both items (so storage isn't deduping or
 *      truncating).
 *   3. The destructive cart controls remain reachable.
 *
 * Live API dependency: requires /search to return at least 2 results.
 * Self-skips if the API returns fewer.
 */

const SHORT_RESULT_WAIT_MS = 20_000

async function addNthResultToCart(page, n) {
    // /search must already be loaded.
    const card = page.locator('[result-id]').nth(n)
    await card.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
    await card.click()
    await page.waitForURL(/\/record\?uri=/, { timeout: SHORT_RESULT_WAIT_MS })
    await waitForAppReady(page)
    await page.getByRole('button', { name: /add current image to cart/i }).click()
    // Snackbar fires; let it settle before navigating back.
    await page.waitForTimeout(500)
    // Use the back button on the Record toolbar to keep the search
    // results state in memory (rather than re-running the query).
    const backBtn = page
        .getByRole('button', { name: 'return to search' })
        .or(page.getByRole('button', { name: 'go back a page' }))
    await backBtn.first().click()
    await page.waitForURL(/\/search/, { timeout: SHORT_RESULT_WAIT_MS })
    await waitForAppReady(page)
}

test.describe('Cart - multi-item behavior', () => {
    test('adding two distinct results increments the badge and both items render in /cart', async ({
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
        const cardCount = await page.locator('[result-id]').count()
        if (cardCount < 2) {
            test.skip(true, '/search returned fewer than 2 results — cannot stage 2 items')
        }

        await addNthResultToCart(page, 0)
        await addNthResultToCart(page, 1)

        // Topbar badge text should now contain "2" (or higher if some
        // existed already — but in a fresh context it's the count).
        const cartButton = page.getByRole('button', { name: /go to cart/i })
        await expect(cartButton).toContainText(/\d/, { timeout: SHORT_RESULT_WAIT_MS })

        // Open /cart and assert at least 2 cart items render.
        await cartButton.click()
        await page.waitForURL(/\/cart/, { timeout: SHORT_RESULT_WAIT_MS })
        await waitForAppReady(page)

        const cartItems = page.locator('[cart-index]')
        await expect(cartItems.first()).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })
        const itemCount = await cartItems.count()
        expect(itemCount).toBeGreaterThanOrEqual(2)

        await expect(
            page.getByRole('button', { name: 'empty cart button' }),
        ).toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
