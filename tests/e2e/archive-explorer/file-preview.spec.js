import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Archive Explorer - column items expose quick-download / add-to-cart.
 *
 * `column-drilling.spec.js` covers Mission -> Bundle navigation. This
 * spec drills one level deeper: after the second column populates,
 * each item should expose two affordances - "quick download" and
 * "add to cart" (per Columns.js lines 1240 & 1439). These are the
 * regression surfaces a user notices first when the per-item
 * affordances disappear.
 *
 * Per the bulk-download rule, we only assert the buttons are visible
 * and reachable. We never click "quick download" because it would
 * trigger a real transfer.
 *
 * Drilling depends on the upstream PDS API. If the second column
 * never populates within the budget, the test gracefully self-skips.
 */

const COLUMN_WAIT_MS = 20_000
const KNOWN_MISSION = 'Mars 2020'

test.describe('Archive Explorer - per-item affordances', () => {
    test('items in the bundles/volumes column expose "add to cart" affordance (NOT clicked)', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const mars = page.locator('li', { hasText: KNOWN_MISSION }).first()
        try {
            await mars.waitFor({ state: 'visible', timeout: COLUMN_WAIT_MS })
        } catch {
            test.skip(true, 'Missions column never populated — API likely down.')
        }
        await mars.click()

        // Wait for the second column heading to render.
        const bundlesHeader = page.getByRole('heading', { name: 'Bundles(PDS4)' })
        const volumesHeader = page.getByRole('heading', { name: 'Volumes(PDS3)' })
        try {
            await expect(bundlesHeader.or(volumesHeader).first()).toBeVisible({
                timeout: COLUMN_WAIT_MS,
            })
        } catch {
            test.skip(true, 'Second column never populated — API likely down.')
        }

        // The "add to cart" affordance is rendered on each item in
        // the second column. We only assert *some* exist.
        const addToCart = page.getByRole('button', { name: 'add to cart', exact: true })
        await expect(addToCart.first()).toBeVisible({ timeout: COLUMN_WAIT_MS })

        // Bulk-download rule: we deliberately do NOT click any
        // "quick download" button — those would trigger real bytes.
        const quickDownload = page.getByRole('button', { name: 'quick download' })
        // visibility-only assertion
        await expect(quickDownload.first()).toBeVisible({ timeout: COLUMN_WAIT_MS })

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
