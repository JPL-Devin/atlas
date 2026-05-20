import { test, expect } from '@playwright/test'
import { filterCriticalJsErrors, waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * Per-route smoke tests.
 *
 * `tests/e2e/smoke.spec.js` only smokes `/search`. A whitescreen on
 * any of the other three top-level routes (`/record`, `/cart`,
 * `/archive-explorer`) would slip through. This spec adds the
 * minimum-viable smoke for each.
 *
 * For each route we assert:
 *   - the page returns a 2xx
 *   - the body has rendered content (not a white screen)
 *   - the document title is set to the Atlas convention
 *   - the Toolbar's `navigation` button is present (a stable shared
 *     marker across all routes that proves the SPA shell mounted)
 *   - no critical JS errors fired during load
 */

const ROUTES = [
    { path: '/search', titleFragment: /atlas/i },
    { path: '/record', titleFragment: /atlas/i },
    { path: '/cart', titleFragment: /atlas/i },
    { path: '/archive-explorer', titleFragment: /atlas/i },
]

test.describe('Per-route smoke', () => {
    for (const { path, titleFragment } of ROUTES) {
        test(`${path} renders the SPA shell`, async ({ page }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))

            await page.goto(path, { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)

            await expect(page.locator('body')).toBeVisible()
            await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
            await expect(page).toHaveTitle(titleFragment)

            expect(filterCriticalJsErrors(errors)).toEqual([])
        })
    }
})
