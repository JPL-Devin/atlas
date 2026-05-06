import { test, expect } from '@playwright/test'
import { navigateToSearch } from '../../helpers/atlas-helpers.js'

/**
 * Verify that the Topbar route-buttons actually *navigate* (not just
 * that they're visible — that's covered by toolbar.spec.js).
 *
 * The Topbar buttons live in `src/components/Topbar/index.js` and are
 * labelled:
 *   - go to api documentation  (external; we don't navigate to it)
 *   - go to image search       → `/search`
 *   - go to archive explorer   → `/archive-explorer`
 *   - go to cart               → `/cart`
 */

test.describe('Click-driven route navigation', () => {
    test('Topbar "go to cart" navigates to /cart', async ({ page }) => {
        await navigateToSearch(page)

        await page.getByRole('button', { name: /go to cart/i }).click()
        await page.waitForURL((u) => u.pathname.includes('/cart'), { timeout: 30000 })

        expect(page.url()).toContain('/cart')
    })

    test('Topbar "go to archive explorer" navigates to /archive-explorer', async ({ page }) => {
        await navigateToSearch(page)

        await page.getByRole('button', { name: /go to archive explorer/i }).click()
        await page.waitForURL((u) => u.pathname.includes('/archive-explorer'), {
            timeout: 30000,
        })

        expect(page.url()).toContain('/archive-explorer')
    })

    test('Topbar "go to image search" returns from /cart to /search', async ({ page }) => {
        await page.goto('/cart', { waitUntil: 'domcontentloaded' })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        await page.getByRole('button', { name: /go to image search/i }).click()
        await page.waitForURL((u) => u.pathname.includes('/search'), { timeout: 30000 })

        expect(page.url()).toContain('/search')
    })

    test('Browser back restores the previous route', async ({ page }) => {
        await navigateToSearch(page)
        await page.getByRole('button', { name: /go to cart/i }).click()
        await page.waitForURL((u) => u.pathname.includes('/cart'), { timeout: 30000 })

        await page.goBack()
        await page.waitForURL((u) => u.pathname.includes('/search'), { timeout: 30000 })
        expect(page.url()).toContain('/search')
    })

    test('Toolbar "Restart search" button is wired and clickable', async ({ page }) => {
        await navigateToSearch(page)

        const btn = page.getByRole('button', { name: 'Restart search' })
        await expect(btn).toBeVisible()
        await expect(btn).toBeEnabled()

        // We deliberately do NOT verify post-click state here: in test
        // environments where the PDS API is unreachable, Restart search
        // dispatches a re-fetch that the offline API rejects, and the
        // resulting Redux/immutable.js exceptions can collapse the
        // React tree. Catching that regression requires the API to be
        // mocked (see Bucket F integration tests).
        await btn.click()
        await page.waitForTimeout(200)
        await expect(page.locator('body')).toBeVisible()
    })
})
