import { test, expect } from '@playwright/test'

/**
 * Global shell controls.
 *
 * The left icon rail was removed; the navigation drawer trigger and
 * the Info action now live in the Topbar, and the search workspace
 * controls live in the results heading.
 */
test.describe('Topbar shell controls', () => {
    test('topbar exposes a navigation hamburger button', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
    })

    test('the info button is the last icon on the right of the topbar', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        const info = page.getByRole('button', { name: 'info button' })
        await expect(info).toBeVisible()

        const infoBox = await info.boundingBox()
        const cartBox = await page.getByRole('button', { name: /go to cart/i }).boundingBox()
        expect(infoBox.x).toBeGreaterThan(cartBox.x)
    })

    test('the removed rail controls are gone', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        for (const name of [
            'filters panel',
            'Map Panel',
            'Results Panel',
            'Restart search',
            'help button',
            'options',
        ]) {
            await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
        }
    })

    test('the filters sidebar is always shown on desktop', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.getByRole('button', { name: 'filters', exact: true })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'add filter' })).toBeVisible()
    })

    test('topbar exposes route navigation links to all main routes', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.getByRole('button', { name: /go to image search/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /go to archive explorer/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /go to cart/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /go to api documentation/i })).toBeVisible()
    })
})
