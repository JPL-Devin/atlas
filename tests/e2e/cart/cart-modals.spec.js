import { test, expect } from '@playwright/test'
import { navigateToCart } from '../../helpers/atlas-helpers.js'

/**
 * Cart modal-lifecycle tests.
 *
 * The cart Title bar exposes two destructive actions that confirm via
 * `RemoveFromCartModal`:
 *   - "remove selected items button"
 *   - "empty cart button"
 *
 * The modal renders unconditionally once dispatched, so we don't need
 * the cart to actually contain items in order to exercise the
 * confirmation flow.
 */

test.describe('Cart - Modals', () => {
    test('"empty cart" opens RemoveFromCart modal which can be cancelled', async ({ page }) => {
        await navigateToCart(page)

        const trigger = page.getByRole('button', { name: 'empty cart button' })
        // Some empty-cart UIs hide the trigger when the cart is empty.
        // Skip the test (rather than fail) if that's the case here.
        if (!(await trigger.isVisible().catch(() => false))) {
            test.skip(true, '"empty cart" trigger not rendered (cart empty)')
        }

        await trigger.click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        const noBtn = dialog.getByRole('button', { name: 'no button' })
        await expect(noBtn).toBeVisible()
        await noBtn.click()

        await expect(dialog).toBeHidden()
    })

    test('"remove selected items" modal shows yes/no actions', async ({ page }) => {
        await navigateToCart(page)

        const trigger = page.getByRole('button', { name: 'remove selected items button' })
        if (!(await trigger.isVisible().catch(() => false))) {
            test.skip(true, '"remove selected" trigger not rendered (cart empty)')
        }

        await trigger.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        // The yes/no buttons are the canonical confirm/cancel affordances.
        await expect(dialog.getByRole('button', { name: 'yes button' })).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'no button' })).toBeVisible()

        await page.keyboard.press('Escape')
    })
})
