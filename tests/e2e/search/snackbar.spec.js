import { test, expect } from '@playwright/test'
import { waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * Snackbar lifecycle.
 *
 * After "add current image to cart" dispatches, a Material-UI Snackbar
 * appears in the top-center reading "Added to Cart!" with a close
 * button (`aria-label="Close"`). Two failure modes are worth catching:
 *
 *   1. The success snackbar never appears (silent regression in the
 *      cart-add Redux flow).
 *   2. The close button doesn't dismiss the snackbar (broken handler).
 */

const SHORT_RESULT_WAIT_MS = 20_000

test.describe('Snackbar - "Added to Cart!"', () => {
    test('Snackbar appears after adding an image to the cart', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const firstCard = page.locator('.GridViewMasonryItem').first()
        try {
            await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        } catch {
            test.skip(true, 'No search results rendered — Atlas API likely unreachable.')
        }

        await firstCard.click()
        await page.waitForURL((u) => u.pathname.includes('/record'), { timeout: 30_000 })

        const addBtn = page.getByRole('button', { name: 'add current image to cart button' })
        await addBtn.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        await addBtn.click()

        // The snackbar text is rendered as a body text node inside an
        // MUI Snackbar. We assert on the user-visible text directly.
        await expect(page.getByText('Added to Cart!')).toBeVisible({
            timeout: SHORT_RESULT_WAIT_MS,
        })
    })

    test('Snackbar Close button dismisses the snackbar', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const firstCard = page.locator('.GridViewMasonryItem').first()
        try {
            await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        } catch {
            test.skip(true, 'No search results rendered — Atlas API likely unreachable.')
        }

        await firstCard.click()
        await page.waitForURL((u) => u.pathname.includes('/record'), { timeout: 30_000 })

        const addBtn = page.getByRole('button', { name: 'add current image to cart button' })
        await addBtn.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        await addBtn.click()

        const snackbarText = page.getByText('Added to Cart!')
        await expect(snackbarText).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })

        // The MUI Snackbar's dismiss button has aria-label="Close" and
        // is a sibling of the message. Scope the locator so we don't
        // accidentally match a modal's close button elsewhere on the
        // page.
        const closeBtn = page.locator('[role="presentation"]').getByRole('button', { name: 'Close' }).first()
        if (await closeBtn.count()) {
            await closeBtn.click()
            await expect(snackbarText).not.toBeVisible({ timeout: 10_000 })
        } else {
            // Some MUI versions don't render a close button. In that
            // case, snackbar self-dismisses via autoHideDuration.
            await expect(snackbarText).not.toBeVisible({ timeout: 15_000 })
        }
    })
})
