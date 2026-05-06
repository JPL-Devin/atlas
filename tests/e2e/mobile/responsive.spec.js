import { test, expect } from '@playwright/test'
import { filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Mobile / responsive layout tests for Atlas.
 *
 * Atlas's Search page (src/pages/Search/Search.js) checks
 * useMediaQuery(theme.breakpoints.down('md')) and returns a single-panel
 * layout instead of three side-by-side panels when isMobile is true.
 *
 * We use 375x667 (iPhone SE class) as the mobile viewport.
 */

test.describe('Mobile Responsive Behavior', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('search page renders on mobile viewport', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const body = page.locator('body')
        await expect(body).toBeVisible()
    })

    test('Toolbar navigation hamburger remains visible on mobile', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
    })

    test('mobile workspace shows panel toggle buttons so users can switch panels', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        // The Search component renders one panel at a time on mobile, but
        // the workspace toggles are still rendered so the user can switch.
        await expect(page.getByRole('button', { name: 'filters panel' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Results Panel' })).toBeVisible()
    })

    test('no horizontal scrollbar on mobile viewport', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        })
        expect(hasHorizontalScroll).toBe(false)
    })

    test('page renders without critical JS errors on mobile', async ({ page }) => {
        const errors = []
        page.on('pageerror', (err) => errors.push(err.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const critical = filterCriticalJsErrors(errors)
        expect(critical).toEqual([])
    })
})
