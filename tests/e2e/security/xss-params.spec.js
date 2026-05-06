import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * XSS via URL parameters.
 *
 * /search and /record both consume URL parameters (?_text=, ?uri=,
 * etc.) and can render them into the DOM (e.g. as a chip label, a
 * filter value, or a heading). If a payload is injected unescaped,
 * an attacker can navigate a victim to a crafted Atlas URL and
 * execute JavaScript.
 *
 * We verify that common XSS payloads in URL params are inert:
 *
 *   1. The payload's <script> does not execute (no `pageerror` from
 *      a synthetic dialog handler).
 *   2. No `alert` dialog opens (Playwright catches dialogs).
 *   3. The SPA shell still renders.
 *
 * We do NOT assert that the payload is *removed* from the URL (it
 * may legitimately stay in the address bar). We assert it is not
 * *executed* and the DOM doesn't contain a literal `<script>` tag
 * the SPA placed there.
 */

const PAYLOADS = [
    "<script>window.__xss_fired=true;</script>",
    "<img src=x onerror=\"window.__xss_fired=true\">",
    "<svg/onload=window.__xss_fired=true>",
]

test.describe('Security - XSS via URL params is inert', () => {
    for (const payload of PAYLOADS) {
        test(`?_text=${encodeURIComponent(payload)} on /search does not execute`, async ({
            page,
        }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))
            // Failsafe: any dialog implies a payload fired.
            page.on('dialog', async (d) => {
                throw new Error(`Unexpected dialog from XSS payload: ${d.message()}`)
            })

            await page.goto(`/search?_text=${encodeURIComponent(payload)}`, {
                waitUntil: 'domcontentloaded',
            })
            await waitForAppReady(page)

            // SPA shell is alive.
            await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()

            // The marker the payload would have set must not exist.
            const fired = await page.evaluate(() => Boolean(window.__xss_fired))
            expect(fired).toBe(false)

            // No critical JS errors caused by the payload.
            expect(filterCriticalJsErrors(errors)).toEqual([])
        })
    }
})
