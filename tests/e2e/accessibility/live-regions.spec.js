import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * ARIA live region announcements.
 *
 * Atlas uses MUI Snackbar + Alert (`src/components/SnackBar/SnackBar.js`)
 * to surface feedback like "Added to Cart!", "Copied to Clipboard!",
 * etc. MUI's Alert renders with `role="alert"` which implies
 * `aria-live="assertive"` — meaning screen readers announce the
 * change without being prompted. A regression that swaps Alert for
 * a plain `<div>` (or removes the role) silently breaks the
 * announcement without anything visually changing.
 *
 * This spec verifies:
 *
 *   1. After "add current image to cart", an alert role with the
 *      success message appears in the DOM.
 *   2. The empty-state ResultsStatus renders with discoverable text
 *      ("No Records Found") so screen readers can read it.
 */

const SHORT_RESULT_WAIT_MS = 20_000

test.describe('A11y - live region announcements', () => {
    test('"Added to Cart!" is announced via role="alert"', async ({ page }) => {
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
        await firstCard.click()
        await page.waitForURL(/\/record\?uri=/, { timeout: SHORT_RESULT_WAIT_MS })
        await waitForAppReady(page)

        await page.getByRole('button', { name: /add current image to cart/i }).click()

        // The MUI Alert inside the Snackbar carries role="alert".
        const alert = page.getByRole('alert')
        await expect(alert).toBeVisible({ timeout: 10_000 })
        await expect(alert).toContainText(/added to cart/i)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('forced-empty-state ResultsStatus renders "No Records Found" as discoverable text', async ({
        page,
    }) => {
        // Force an empty-hits response so the test is independent of
        // the live API.
        await page.route(/_search/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    took: 1,
                    timed_out: false,
                    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
                    hits: { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] },
                    aggregations: {},
                }),
            })
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // The "No Records Found" message should be present in the
        // accessibility tree as static text. We use Playwright's
        // text matcher, which traverses textContent the same way a
        // screen reader would walk role=text nodes.
        await expect(page.getByText(/no records found/i)).toBeVisible({
            timeout: 10_000,
        })
    })
})
