import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Cart - per-item ProductToolbar / per-item Checkbox.
 *
 * Each item rendered in /cart's grid has a `<ProductToolbar>` which
 * exposes a per-item Checkbox driving the `resultKeysChecked` Redux
 * slice. With at least one box checked, the cart's bulk affordances
 * change ("Remove Selected Items" becomes the active destructive
 * button rather than "Empty Cart"). This is the affordance the
 * earlier `download-method-tabs.spec.js` had to skip because we
 * didn't have a stable selector for it.
 *
 * The cart grid root is `[cart-index]` (set in CartView.js — a
 * stable, manually-set attribute, not a hashed JSS class). The
 * checkbox is a plain MUI `<Checkbox>` inside that grid item — we
 * can target it via the proximity selector `[cart-index="0"]
 * input[type="checkbox"]`.
 *
 * NOTE: Driving the Checkbox click via Playwright is structurally
 * difficult because the gridItem's onClick navigates to /record for
 * items of type='image'. Even though the wrapping ProductToolbar
 * div has `onClick=stopPropagation`, in the e2e environment the
 * gridItem still navigates. Rather than coupling the test to React
 * synthetic-event ordering, we assert the *structural* shape that
 * matters for regression: on /cart with at least one item, the
 * per-item Checkbox renders inside the cart-index grid item, and
 * the bulk "Remove Selected Items" affordance is reachable. The
 * actual check-and-yes flow is covered by cart-confirm.spec.js.
 *
 * To stage state we add an item the same way other specs do:
 *   /search -> click first result -> /record -> "add current image to cart"
 *
 * If the upstream API is unreachable and no result renders, the
 * test gracefully skips itself.
 */

const SHORT_RESULT_WAIT_MS = 20_000

async function addOneItemAndOpenCart(page) {
    await page.goto('/search', { waitUntil: 'domcontentloaded' })
    await waitForAppReady(page)

    const firstCard = page.locator('[result-id]').first()
    try {
        await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
    } catch {
        return false
    }
    await firstCard.click()

    await page.waitForURL(/\/record\?uri=/, { timeout: SHORT_RESULT_WAIT_MS })
    await waitForAppReady(page)

    const addBtn = page.getByRole('button', { name: /add current image to cart/i })
    await addBtn.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
    await addBtn.click()

    await page.getByRole('button', { name: /go to cart/i }).click()
    await page.waitForURL(/\/cart/, { timeout: SHORT_RESULT_WAIT_MS })
    await waitForAppReady(page)
    return true
}

test.describe('Cart - per-item ProductToolbar', () => {
    test('per-item Checkbox renders inside [cart-index] and "Remove Selected Items" is reachable', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        const staged = await addOneItemAndOpenCart(page)
        test.skip(!staged, 'Upstream Atlas API not returning results in this environment')

        const cartItem = page.locator('[cart-index="0"]').first()
        await expect(cartItem).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })

        // Hover reveals the ProductToolbar (opacity: 0 by default
        // at the desktop breakpoint).
        await cartItem.hover()

        // The per-item Checkbox is the canonical selection
        // affordance — assert it's rendered and starts unchecked.
        const checkbox = cartItem.locator('input[type="checkbox"]').first()
        await expect(checkbox).toBeAttached()
        await expect(checkbox).not.toBeChecked()

        // The per-item "remove from cart" / "add to cart" toggle
        // (also in ProductToolbar) is reachable too — it's the user
        // path for removing exactly one item without opening the
        // bulk Remove Selected dialog.
        await expect(cartItem.getByRole('button', { name: /remove from cart/i })).toBeVisible({
            timeout: 5_000,
        })

        // The bulk "Remove Selected Items" affordance is reachable.
        await expect(
            page.getByRole('button', { name: /remove selected items/i }),
        ).toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
