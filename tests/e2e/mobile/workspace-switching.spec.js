import { test, expect } from '@playwright/test'
import { navigateToSearch, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Mobile workspace switching.
 *
 * Below the MUI `md` breakpoint, `/search` shows ONE of the three
 * panels at a time, controlled by Redux's `workspace.mobile` slice.
 * The switch is driven by the same Toolbar buttons used on desktop:
 *   - "filters panel"
 *   - "Map Panel"
 *   - "Results Panel"
 *
 * Reference: `src/pages/Search/Search.js` lines 50-73.
 */

test.use({
    viewport: { width: 375, height: 667 },
})

test.describe('Mobile - workspace switching', () => {
    test('the three panel-toggle buttons remain reachable on a mobile viewport', async ({
        page,
    }) => {
        await navigateToSearch(page)

        // The Toolbar buttons are how users move between panels on
        // mobile. They must always be present.
        await expect(page.getByRole('button', { name: 'filters panel' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Map Panel' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Results Panel' })).toBeVisible()
    })

    test('clicking each mobile workspace button does not crash', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await navigateToSearch(page)

        // Cycle through all three. We don't have stable, panel-specific
        // markers we can assert on without API data, but we can at
        // least verify the UI doesn't throw and the toolbar stays
        // interactive.
        for (const label of ['filters panel', 'Map Panel', 'Results Panel']) {
            await page.getByRole('button', { name: label }).click()
            await page.waitForTimeout(150)
            await expect(page.locator('body')).toBeVisible()
        }

        // Filter network/Redux noise that's expected when the API is
        // unreachable; assert nothing else crashed.
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('on mobile, the navigation hamburger remains visible', async ({ page }) => {
        await navigateToSearch(page)
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
    })

    test('mobile /cart renders without crashing', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/cart', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        await expect(page.locator('body')).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
