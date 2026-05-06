import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Tablet viewport.
 *
 * `mobile/responsive.spec.js` and `mobile/workspace-switching.spec.js`
 * cover 375x667. The desktop suite covers 1280x720. The tablet
 * breakpoint (`md` boundary at 960px in `src/themes/light.js`) is
 * uncovered.
 *
 * Atlas's responsive layout is gated by `useMediaQuery(theme.breakpoints.down('md'))`
 * (Search.js:47) — anything *strictly less than* 960 renders the
 * mobile workspace switcher. We test two viewport widths around that
 * boundary:
 *
 *   - 768x1024 (iPad portrait): mobile layout (single panel + switcher).
 *   - 1024x768 (iPad landscape): desktop layout (all three panels).
 *
 * That ensures both branches of the breakpoint are exercised.
 */

test.describe('Tablet viewports', () => {
    test('iPad portrait (768x1024) renders the mobile workspace switcher', async ({
        browser,
    }) => {
        const context = await browser.newContext({
            viewport: { width: 768, height: 1024 },
        })
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        try {
            await page.goto('/search', { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)

            // Mobile workspace switcher exposes "filters panel" /
            // "Map Panel" / "Results Panel" buttons.
            await expect(
                page.getByRole('button', { name: 'filters panel' }),
            ).toBeVisible({ timeout: 20_000 })

            expect(filterCriticalJsErrors(errors)).toEqual([])
        } finally {
            await context.close()
        }
    })

    test('iPad landscape (1024x768) renders the desktop three-panel layout', async ({
        browser,
    }) => {
        const context = await browser.newContext({
            viewport: { width: 1024, height: 768 },
        })
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        try {
            await page.goto('/search', { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)

            // Desktop layout: FiltersPanel "+" affordance + the map.
            await expect(page.getByRole('button', { name: 'add filter' })).toBeVisible({
                timeout: 20_000,
            })
            await expect(page.getByText('Map', { exact: true })).toBeVisible()

            expect(filterCriticalJsErrors(errors)).toEqual([])
        } finally {
            await context.close()
        }
    })
})
