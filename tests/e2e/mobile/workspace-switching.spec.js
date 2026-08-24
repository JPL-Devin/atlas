import { test, expect } from '@playwright/test'
import { navigateToSearch, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Mobile search workspace.
 *
 * There is no mobile panel switcher any more: results are always the
 * page, filters open as a full-screen sheet from the `filters` button
 * in the results heading, and the map is a results view tab.
 *
 * Reference: `src/pages/Search/Search.js`,
 * `src/pages/Search/Panels/FiltersPanel/FiltersPanel.js`.
 */

test.use({
    viewport: { width: 375, height: 667 },
})

test.describe('Mobile - search workspace', () => {
    test('results are shown with the filters sheet closed', async ({ page }) => {
        await navigateToSearch(page)

        await expect(page.getByRole('button', { name: 'filters', exact: true })).toBeVisible()
        await expect(page.getByRole('tab', { name: 'Grid', exact: true })).toBeVisible()
        // The sheet is closed, so its close affordance is absent.
        await expect(page.getByRole('button', { name: 'close filters' })).toHaveCount(0)
    })

    test('the filters sheet opens and closes without crashing', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await navigateToSearch(page)

        await page.getByRole('button', { name: 'filters', exact: true }).click()
        const close = page.getByRole('button', { name: 'close filters' })
        await expect(close).toBeVisible()
        await expect(page.getByRole('button', { name: 'reset filters', exact: true })).toBeVisible()

        await close.click()
        await expect(close).toHaveCount(0)
        await expect(page.getByRole('tab', { name: 'Grid', exact: true })).toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('switching to the Map view keeps the page interactive', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await navigateToSearch(page)

        for (const name of ['Map', 'Grid']) {
            const tab = page.getByRole('tab', { name, exact: true })
            await tab.click()
            await expect(tab).toHaveAttribute('aria-selected', 'true')
        }

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('the results heading does not overflow horizontally at 375x667', async ({ page }) => {
        await navigateToSearch(page)

        const overflows = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        })
        expect(overflows).toBe(false)
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
