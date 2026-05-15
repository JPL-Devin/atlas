import { test, expect } from '@playwright/test'

/**
 * Smoke tests for Atlas application.
 * Basic checks to verify the production server starts and serves the SPA.
 */

test.describe('Atlas Application - Smoke Tests', () => {
    test('GET /_health returns 200', async ({ request }) => {
        const res = await request.get('/_health')
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.status).toBe('healthy')
        expect(body.version).toBeDefined()
        expect(body.version.atlas).toBeDefined()
    })

    test('root URL redirects to /search', async ({ request }) => {
        const res = await request.get('/', { maxRedirects: 0 })
        expect([301, 302, 307, 308]).toContain(res.status())
        const location = res.headers()['location']
        expect(location).toContain('/search')
    })

    test('application loads without a white screen', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const body = page.locator('body')
        await expect(body).toBeVisible()

        const hasContent = await page.evaluate(() => document.body.innerHTML.length > 200)
        expect(hasContent).toBeTruthy()
    })

    test('stylesheets load without errors', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const sheetCount = await page.evaluate(() => document.styleSheets.length)
        expect(sheetCount).toBeGreaterThan(0)
    })
})
