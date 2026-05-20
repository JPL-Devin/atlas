import { test, expect } from '@playwright/test'
import { filterCriticalJsErrors, waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * URL / query-string round-tripping.
 *
 * Atlas is heavily URL-driven:
 *   - `/search?...` carries selected filters (read by
 *     `src/core/redux/actions/actions.js`).
 *   - `/record?uri=...` selects which record to display
 *     (read by `src/pages/Record/Title/Title.js`).
 *
 * Users share these URLs as deep links, so a regression that breaks
 * query-string parsing or that crashes on malformed input is
 * particularly user-facing.
 */

test.describe('URL state', () => {
    test('/search renders without crashing when given an unknown query param', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search?totallyUnknown=abc&another=123', {
            waitUntil: 'domcontentloaded',
        })
        await waitForAppReady(page)

        await expect(page.locator('body')).toBeVisible()
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('/record without ?uri renders the page shell', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/record', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await expect(page.locator('body')).toBeVisible()
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('/record with malformed ?uri does not crash', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Garbage-but-URL-encoded input. The page should render its
        // shell and either show an error state or an empty record —
        // but should not throw an uncaught exception.
        await page.goto('/record?uri=' + encodeURIComponent('not-a-real-uri:::///'), {
            waitUntil: 'domcontentloaded',
        })
        await waitForAppReady(page)

        await expect(page.locator('body')).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('back/forward navigation between routes preserves the URL', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await page.goto('/cart', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        expect(page.url()).toContain('/cart')

        await page.goBack()
        await page.waitForURL((u) => u.pathname.includes('/search'), { timeout: 30000 })
        expect(page.url()).toContain('/search')

        await page.goForward()
        await page.waitForURL((u) => u.pathname.includes('/cart'), { timeout: 30000 })
        expect(page.url()).toContain('/cart')
    })

    test('an unknown route renders without crashing the SPA', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Atlas defines an `Error404` component but we don't want to
        // assert on its exact wording — just that the SPA stays alive.
        await page.goto('/this-route-does-not-exist', {
            waitUntil: 'domcontentloaded',
        })
        // Some apps redirect /unknown to /search; either is acceptable as
        // long as no critical JS error fires.
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
        await expect(page.locator('body')).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
