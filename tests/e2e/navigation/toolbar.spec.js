import { test, expect } from '@playwright/test'

test.describe('Toolbar', () => {
    test('toolbar exposes a navigation hamburger button', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
    })

    test('toolbar exposes the three Search panel toggles', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.getByRole('button', { name: 'filters panel' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Map Panel' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Results Panel' })).toBeVisible()
    })

    test('toolbar exposes a "restart search" button', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.getByRole('button', { name: 'Restart search' })).toBeVisible()
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
