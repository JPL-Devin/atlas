import { test, expect } from '@playwright/test'
import fs from 'fs'
import { firefox } from 'playwright-core'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Cross-browser smoke tests.
 *
 * `playwright.config.js` registers a `firefox` project with
 * `testMatch: /cross-browser/`. Without any specs in this directory
 * the firefox project is a no-op (Playwright would report 0 tests
 * for that project). This spec gives the firefox project something
 * meaningful to run while keeping it intentionally narrow — only
 * the most browser-engine-sensitive surfaces:
 *
 *   1. The SPA shell renders without a critical JS error
 *   2. Each of the four routes loads
 *   3. The Topbar navigation button (which gates the drawer) is
 *      visible and clickable
 *
 * Anything more involved (filters, modals, OpenSeadragon) is left
 * to the chromium project, which is the canonical CI suite.
 *
 * Firefox is an optional Playwright browser. If a contributor has only
 * run `npx playwright install chromium` (or used the bare `chromium`
 * project), the firefox binary won't be on disk and `browserType.launch`
 * would otherwise fail with `Executable doesn't exist at <path>`.
 * Rather than fail the whole suite, we detect the missing binary at
 * module-load time and skip the firefox project with a clear hint.
 */

const ROUTES = ['/search', '/record', '/cart', '/archive-explorer']

const firefoxBinaryExists = (() => {
    try {
        const path = firefox.executablePath()
        return Boolean(path) && fs.existsSync(path)
    } catch {
        return false
    }
})()

test.describe('Cross-browser smoke', () => {
    test.skip(
        !firefoxBinaryExists,
        'Firefox not installed for Playwright. Run `npx playwright install firefox` to enable cross-browser smoke tests.',
    )

    for (const route of ROUTES) {
        test(`route ${route} renders SPA shell without a critical JS error`, async ({
            page,
        }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))

            await page.goto(route, { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)

            const bodyHasContent = await page.evaluate(
                () => document.body && document.body.innerHTML.length > 100,
            )
            expect(bodyHasContent).toBeTruthy()

            await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
            expect(filterCriticalJsErrors(errors)).toEqual([])
        })
    }

    test('navigation button opens the toolbar drawer', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await page.getByRole('button', { name: 'navigation' }).click()

        // The drawer surfaces the "Atlas" wordmark on its first row.
        await expect(page.getByText(/atlas/i).first()).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
