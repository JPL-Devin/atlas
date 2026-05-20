import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * localStorage cold-start.
 *
 * Atlas persists the cart to `localStorage.ATLAS_CART` (see
 * `src/core/constants.js#localStorageCart` and
 * `src/core/redux/store/initial.js`). On cold start, the SPA reads
 * that value and seeds Redux with it.
 *
 * Two regression surfaces:
 *
 *   1. The SPA fails to read localStorage (e.g. JSON parse fails or
 *      localStorage gates change). The cart appears empty even
 *      though the user previously had items.
 *   2. `item.checked === true` is forcibly reset on read (per
 *      `initial.js` line 22-24) — verify the cart is loaded but no
 *      item starts pre-selected.
 *
 * To stage state without going through the live API, we set
 * localStorage directly via `addInitScript()` so it's there before
 * the SPA's bootstrap reads it.
 */

const SEEDED_CART = [
    {
        type: 'image',
        item: {
            uri: 'pds:img:msl:msl:msl_mmm/data/sol/00100/example_uri',
            release_id: 1,
        },
        checked: true,
    },
    {
        type: 'image',
        item: {
            uri: 'pds:img:msl:msl:msl_mmm/data/sol/00101/example_uri',
            release_id: 1,
        },
    },
]

test.describe('Cart - localStorage cold-start', () => {
    test('seeded ATLAS_CART is read on first paint and the badge shows the count', async ({
        page,
        context,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Inject a seed via init script — runs *before* the SPA's
        // store bootstrap reads localStorage on first load.
        await context.addInitScript(
            ({ key, value }) => {
                window.localStorage.setItem(key, JSON.stringify(value))
            },
            { key: 'ATLAS_CART', value: SEEDED_CART },
        )

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // Badge text on the "go to cart" button should contain the
        // length we seeded (2).
        const cartButton = page.getByRole('button', { name: /go to cart/i })
        await expect(cartButton).toContainText(/2/, { timeout: 20_000 })

        // Drill into /cart — both items should render.
        await cartButton.click()
        await page.waitForURL(/\/cart/, { timeout: 20_000 })
        await waitForAppReady(page)

        await expect(page.locator('[cart-index="0"]')).toBeVisible({ timeout: 20_000 })
        await expect(page.locator('[cart-index="1"]')).toBeVisible({ timeout: 20_000 })

        // initial.js line 22-24 forcibly clears `checked: true` on
        // every cart item. Verify: the first item we seeded was
        // checked=true; the persisted state must come back unchecked.
        // Targeting the per-item Checkbox inside ProductToolbar.
        const firstItemCheckbox = page
            .locator('[cart-index="0"] input[type="checkbox"]')
            .first()
        await expect(firstItemCheckbox).not.toBeChecked()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
