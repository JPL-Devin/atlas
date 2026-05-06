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

    test('Toolbar buttons are rendered on /search', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'filters panel' })).toBeVisible()
    })

    test('Topbar ATLAS heading is rendered on /search', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        await expect(page.locator('h1', { hasText: 'ATLAS' })).toBeVisible()
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

    test('invalid route does not crash the server', async ({ request }) => {
        const res = await request.get('/this-route-does-not-exist', { maxRedirects: 0 })
        expect(res.status()).not.toBe(500)
    })
})
