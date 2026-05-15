import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * `javascript:` URI in /record?uri=...
 *
 * /record reads ?uri= and uses it to construct image URLs via
 * `getPDSUrl()`. If `uri` ever lands as the `href` of an anchor or
 * the `src` of an iframe without scheme validation, a
 * `javascript:alert(1)` payload could execute. We verify a request
 * to /record with a `javascript:` URI in the param does not execute
 * any JS, does not open any dialog, and does not cause the SPA to
 * white-screen.
 *
 * `getPDSUrl()` (in `src/core/utils.js`) early-returns the raw URL
 * when it starts with "http" — we want to make sure other input
 * doesn't sneak through to a `javascript:` href.
 */

const PAYLOADS = [
    'javascript:window.__js_uri_fired=true',
    'javascript:alert(1)',
    'JAVASCRIPT:window.__js_uri_fired=true',
    'data:text/html,<script>window.__js_uri_fired=true</script>',
]

test.describe('Security - javascript: URI in ?uri= is inert', () => {
    for (const payload of PAYLOADS) {
        test(`/record?uri=${payload} does not execute and does not crash`, async ({
            page,
        }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))
            page.on('dialog', async (d) => {
                throw new Error(`Unexpected dialog from javascript: URI: ${d.message()}`)
            })

            await page.goto(`/record?uri=${encodeURIComponent(payload)}`, {
                waitUntil: 'domcontentloaded',
            })
            await waitForAppReady(page)

            // SPA still has a topbar / navigation.
            await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()

            const fired = await page.evaluate(() => Boolean(window.__js_uri_fired))
            expect(fired).toBe(false)

            // The SPA must not have synthesized a navigation to the
            // javascript: URI (which would have resulted in a
            // page.url() of "javascript:..."). It should still be on
            // an http-scheme URL.
            expect(page.url().startsWith('http')).toBe(true)

            expect(filterCriticalJsErrors(errors)).toEqual([])
        })
    }
})
