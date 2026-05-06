import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * localStorage corruption recovery.
 *
 * `src/core/redux/store/initial.js` wraps the JSON.parse of
 * `localStorage.ATLAS_CART` in a try/catch and falls back to `[]` on
 * failure. It also normalizes the result to an array if the parsed
 * value is not one. We verify both fallback paths:
 *
 *   1. Malformed JSON ("{not json") -> empty cart, no white-screen.
 *   2. Valid JSON but wrong shape (a string, a number, an object)
 *      -> empty cart, no white-screen.
 *
 * The user-visible regression is "I had a cart yesterday, the SPA
 * crashed and now I can't even reach /cart".
 */

const CORRUPTION_CASES = [
    { name: 'malformed JSON', value: '{not json at all' },
    { name: 'JSON string (not array)', value: '"a string"' },
    { name: 'JSON number (not array)', value: '42' },
    { name: 'JSON object (not array)', value: '{"foo":"bar"}' },
]

test.describe('Cart - localStorage corruption recovery', () => {
    for (const c of CORRUPTION_CASES) {
        test(`${c.name} in ATLAS_CART does not white-screen the SPA`, async ({
            page,
            context,
        }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))

            await context.addInitScript(
                ({ key, raw }) => {
                    // Set the raw string directly without re-encoding.
                    window.localStorage.setItem(key, raw)
                },
                { key: 'ATLAS_CART', raw: c.value },
            )

            await page.goto('/search', { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)

            // SPA shell rendered, no white screen, navigation works.
            await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()

            // Cart is empty (badge is empty / not rendered as digit).
            // The Topbar Badge component hides the count when 0; we
            // can navigate to /cart and assert the empty-state message.
            await page.goto('/cart', { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)
            await expect(page.getByText("Your Cart's Empty", { exact: false })).toBeVisible({
                timeout: 10_000,
            })

            // No critical JS errors fired during recovery.
            const critical = errors.filter((m) => /TypeError|ReferenceError|SyntaxError/.test(m))
            expect(critical).toEqual([])
        })
    }
})
