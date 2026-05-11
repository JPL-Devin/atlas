import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * AddFilter modal — actually using it.
 *
 * `tests/e2e/search/modals.spec.js` already verifies the modal opens
 * and closes via the "add filter" trigger and Escape. This spec
 * exercises the *interactive* path: typing into the "Find Filter"
 * input narrows the tree, and the modal exposes a "Add Selected
 * Filters" submit button. We verify:
 *
 *   1. The Find Filter input accepts text and the typed value sticks.
 *   2. The "Add Selected Filters" submit button exists and is reachable.
 *   3. Clicking the modal's close (aria-label="close") dismisses the
 *      dialog cleanly.
 *
 * We deliberately don't pick a *specific* filter to add — the
 * available filter tree depends on the upstream PDS schema and
 * varies. Asserting the input + submit affordances exist covers the
 * regression surface (silent breakage of the modal's primary
 * behavior).
 */

test.describe('Search - AddFilter modal interactive path', () => {
    test('Find Filter input accepts text and the dialog has a submit button', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // Open the AddFilter modal via the FiltersPanel "+" button.
        await page.getByRole('button', { name: 'add filter' }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible({ timeout: 10_000 })

        // The "Find Filter" input is identified by its placeholder.
        const findInput = page.getByPlaceholder('Find Filter')
        await expect(findInput).toBeVisible()
        await findInput.fill('mission')
        await expect(findInput).toHaveValue('mission')

        // The submit button rendering implies the modal is fully
        // interactive — when no filters are staged its label still
        // says "Add Selected Filters".
        await expect(
            page.getByRole('button', { name: /add selected filters/i }),
        ).toBeVisible()

        // Close the dialog cleanly.
        await page.getByRole('button', { name: 'close' }).first().click()
        await expect(dialog).not.toBeVisible({ timeout: 5_000 })

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
