import { test, expect } from '@playwright/test'
import { filterCriticalJsErrors, waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * End-to-end: search → record → cart.
 *
 * This is the headline user flow: a scientist searches for an image,
 * clicks one to inspect it, adds it to the bulk-download cart, and
 * arrives at /cart ready to pick a download method.
 *
 * IMPORTANT: per explicit instructions from the team, we MUST NOT
 * actually click any of the cart download buttons (CSV / Browser zip /
 * WGET / TXT / CURL / "ADD ALL TO CART"). A wrong click could trigger
 * a multi-terabyte transfer. We only assert that those affordances
 * exist and are reachable.
 *
 * Data dependency: this test relies on the upstream Atlas Elasticsearch
 * API (`REACT_APP_DOMAIN`) being reachable and returning at least one
 * result. When the API is offline (e.g. CI without network egress),
 * `.GridViewMasonryItem` will never render and the test gracefully
 * skips itself rather than failing.
 */

const SHORT_RESULT_WAIT_MS = 20_000

test.describe('E2E - search → record → cart', () => {
    test('user can click a search result, add to cart, and land on /cart with the item', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // 1) Land on /search.
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // 2) Wait for at least one result card to render. If the API is
        //    unreachable we skip the test rather than fail — see the
        //    docstring above.
        const firstCard = page.locator('.GridViewMasonryItem').first()
        try {
            await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        } catch {
            test.skip(
                true,
                'No search results rendered — Atlas Elasticsearch API likely unreachable in this environment.',
            )
        }

        // 3) Click the first result. The handler dispatches navigate()
        //    to `/record?uri=<es-source>`.
        await firstCard.click()
        await page.waitForURL((u) => u.pathname.includes('/record'), { timeout: 30_000 })
        expect(page.url()).toContain('/record?uri=')

        // 4) On /record, locate the "add current image to cart" button.
        const addToCart = page.getByRole('button', { name: 'add current image to cart button' })
        await expect(addToCart).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })

        // 5) Click it. The Topbar cart icon should then carry a count
        //    (rendered as text inside the "go to cart" button — see
        //    `src/components/Topbar/index.js`).
        await addToCart.click()

        const cartButton = page.getByRole('button', { name: /go to cart/i })
        await expect(cartButton).toBeVisible()
        // The badge text is the item count. We accept any digit because
        // the Redux cart state may already contain prior items.
        await expect(cartButton).toContainText(/\d/, { timeout: SHORT_RESULT_WAIT_MS })

        // 6) Click through to /cart.
        await cartButton.click()
        await page.waitForURL((u) => u.pathname.includes('/cart'), { timeout: 30_000 })

        // 7) The cart UI must render its destructive controls so we
        //    know the cart isn't empty.
        await expect(page.getByRole('button', { name: 'remove selected items button' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'empty cart button' })).toBeVisible()

        // 8) Final guardrail: no critical JS errors fired during the
        //    full flow. Network/Redux noise from the always-flaky
        //    upstream API is filtered.
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('Topbar cart badge persists across routes once an item is added', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const firstCard = page.locator('.GridViewMasonryItem').first()
        try {
            await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        } catch {
            test.skip(true, 'No search results rendered — API unreachable.')
        }

        await firstCard.click()
        await page.waitForURL((u) => u.pathname.includes('/record'), { timeout: 30_000 })

        const addToCart = page.getByRole('button', { name: 'add current image to cart button' })
        await addToCart.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        await addToCart.click()

        // Cross-route persistence check: navigate back to /search and
        // forward to /archive-explorer. The cart badge must follow.
        const cartButton = page.getByRole('button', { name: /go to cart/i })
        await expect(cartButton).toContainText(/\d/, { timeout: SHORT_RESULT_WAIT_MS })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(cartButton).toContainText(/\d/)

        await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(cartButton).toContainText(/\d/)
    })
})
