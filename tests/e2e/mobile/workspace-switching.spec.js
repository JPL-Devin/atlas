import { test, expect } from '@playwright/test'
import { navigateToSearch, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Mobile search workspace.
 *
 * Results are always the page. A bottom bar switches between the
 * filters sheet, the results and the map; filters can also be opened
 * from the `filters` button in the results heading.
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

    test('the bottom bar switches between filters, results and the map', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await navigateToSearch(page)

        // The map is a bottom bar destination on phones, not a fourth tab
        await expect(page.getByRole('tab', { name: 'Map', exact: true })).toHaveCount(0)

        await page.getByRole('button', { name: 'map view' }).click()
        await expect(page.locator('.leaflet-container')).toBeVisible()

        await page.getByRole('button', { name: 'filters view' }).click()
        await expect(page.getByRole('button', { name: 'close filters' })).toBeVisible()

        await page.getByRole('button', { name: 'results view' }).click()
        await expect(page.getByRole('button', { name: 'close filters' })).toHaveCount(0)
        await expect(page.getByRole('tab', { name: 'Grid', exact: true })).toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('the results heading does not overflow horizontally at 375x667', async ({ page }) => {
        await navigateToSearch(page)

        // An ancestor clips overflow, so document width alone can hide clipped controls
        const clipped = await page.evaluate(() => {
            const width = document.documentElement.clientWidth
            return [...document.querySelectorAll('button, [role="tab"]')]
                .filter((el) => el.checkVisibility({ visibilityProperty: true }))
                .map((el) => ({
                    name: el.getAttribute('aria-label') || el.textContent.trim(),
                    left: Math.round(el.getBoundingClientRect().left),
                    right: Math.round(el.getBoundingClientRect().right),
                }))
                .filter((box) => box.right > width + 1)
        })
        expect(clipped).toEqual([])

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
