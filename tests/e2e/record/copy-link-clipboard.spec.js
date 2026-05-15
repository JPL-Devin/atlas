import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Record - copy-link clipboard content verification.
 *
 * `record-controls.spec.js` clicks the "copy link to record page"
 * button and asserts no JS error fires, but it never reads what
 * landed in the clipboard. A regression in
 * `core/utils.js#copyToClipboard` (e.g. textarea creation, selection
 * range, execCommand failure) would not be caught.
 *
 * This spec grants clipboard-read permission, drives the same flow,
 * and asserts the clipboard text matches the URL the SPA is on.
 *
 * Live API dependency: relies on /search returning a result so that
 * we can land on /record. Self-skips if the API is unreachable.
 */

const SHORT_RESULT_WAIT_MS = 20_000

test.describe('Record - copy-link clipboard content', () => {
    test('clicking "copy link to record page" writes the current URL to the clipboard', async ({
        page,
        context,
    }) => {
        // Grant clipboard-read so navigator.clipboard.readText() can
        // be called from page.evaluate.
        await context.grantPermissions(['clipboard-read', 'clipboard-write'])

        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const firstCard = page.locator('[result-id]').first()
        try {
            await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        } catch {
            test.skip(true, 'Upstream Atlas API not returning results in this environment')
        }
        await firstCard.click()
        await page.waitForURL(/\/record\?uri=/, { timeout: SHORT_RESULT_WAIT_MS })
        await waitForAppReady(page)

        const expectedURL = page.url()
        await page.getByRole('button', { name: 'copy link to record page' }).click()

        // copyToClipboard() uses textarea + execCommand('copy'), which
        // dispatches synchronously, but give the event loop a tick.
        await page.waitForTimeout(250)

        const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
        expect(clipboardText).toBe(expectedURL)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
