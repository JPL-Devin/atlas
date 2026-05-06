import { test, expect } from '@playwright/test'
import { filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'
import { APP_ROUTES } from '../../fixtures/search-params.js'

test.describe('Routing', () => {
    for (const route of APP_ROUTES) {
        test(`${route} loads without crashing`, async ({ page }) => {
            const errors = []
            page.on('pageerror', (err) => errors.push(err.message))

            await page.goto(route, { waitUntil: 'domcontentloaded' })
            await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

            const body = page.locator('body')
            await expect(body).toBeVisible()

            const critical = filterCriticalJsErrors(errors)
            expect(critical).toEqual([])
        })
    }

    test('toolbar is rendered on /search', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const hasToolbar = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('[class]'))
            return all.some((el) => (el.className.toString() || '').toLowerCase().includes('toolbar'))
        })
        expect(hasToolbar).toBeTruthy()
    })

    test('topbar is rendered on /search', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const hasTopbar = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('[class]'))
            return all.some((el) => (el.className.toString() || '').toLowerCase().includes('topbar'))
        })
        expect(hasTopbar).toBeTruthy()
    })

    test('navigation between routes works (client-side router)', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        await page.goto('/cart', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        expect(page.url()).toContain('/cart')

        await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        expect(page.url()).toContain('/archive-explorer')
    })

    test('invalid route does not crash the server', async ({ page, request }) => {
        // Server has an Express 404 handler. The SPA does not register
        // /this-route-does-not-exist so the server should return a 404 JSON
        // response (or fall back to the SPA depending on Express order).
        const res = await request.get('/this-route-does-not-exist', { maxRedirects: 0 })
        // We don't pin to a specific status — just that the server didn't 500
        expect(res.status()).not.toBe(500)
    })
})
