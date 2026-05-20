import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * AdvancedFilter mode toggling.
 *
 * The FiltersPanel exposes a MoreVert "menu" button (aria-label="menu")
 * that opens a popper with two checkbox options — "Basic Filters" and
 * "Advanced Filters" — plus a separator and four "Copy <X> Command"
 * entries. Switching to advanced flips the panel title from "Basic
 * Filters" to "Advanced Filters". Switching *back* triggers the
 * AdvancedFilterReturnModal ("Advanced Search Warning").
 *
 * There are several `aria-label="menu"` buttons on the page (Topbar,
 * Heading, FiltersPanel) so we anchor on the FiltersPanel title text
 * to disambiguate.
 */

test.describe('FiltersPanel - mode toggling', () => {
    test('FiltersPanel starts in Basic Filters mode', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await expect(page.getByText('Basic Filters', { exact: true })).toBeVisible()
    })

    test('switching to Advanced Filters via the menu flips the panel title', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // The "Add" button (aria-label="add filter") only appears in
        // basic mode and lives in the same heading row as the menu
        // button — use `following::button[@aria-label="menu"]` to walk
        // forward in the DOM to the next "menu" button (the one inside
        // the FiltersPanel heading), avoiding the Topbar / ResultsPanel
        // menu buttons.
        const addBtn = page.getByRole('button', { name: 'add filter' })
        const menuBtn = addBtn.locator('xpath=following::button[@aria-label="menu"][1]')

        await expect(addBtn).toBeVisible()
        await menuBtn.click()

        // Click the "Advanced Filters" menu item.
        await page.getByRole('menuitem', { name: /advanced filters/i }).click()
        // Dismiss the menu popper so it doesn't double-match the title text.
        await page.keyboard.press('Escape')

        // Title flips from "Basic Filters" to "Advanced Filters". Use
        // `.first()` to avoid a strict-mode collision with any lingering
        // "Advanced Filters" menu item that may still be in the DOM.
        await expect(page.getByText('Advanced Filters', { exact: true }).first()).toBeVisible({
            timeout: 10_000,
        })
        // The "add filter" button only renders in basic mode.
        await expect(addBtn).not.toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('switching back to Basic Filters opens the Advanced Search Warning modal', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // First switch INTO advanced mode.
        const addBtn = page.getByRole('button', { name: 'add filter' })
        await expect(addBtn).toBeVisible()
        const menuFromBasic = addBtn.locator('xpath=following::button[@aria-label="menu"][1]')
        await menuFromBasic.click()
        await page.getByRole('menuitem', { name: /advanced filters/i }).click()
        await page.keyboard.press('Escape')
        await expect(
            page.getByText('Advanced Filters', { exact: true }).first(),
        ).toBeVisible({ timeout: 10_000 })

        // Now request a switch back to basic — which is gated by the
        // "Advanced Search Warning" confirmation modal. We scope to the
        // FiltersPanel title (the first matching element) so the locator
        // doesn't pick up a menu item if the popper re-renders.
        const advancedHeading = page.getByText('Advanced Filters', { exact: true }).first()
        const menuFromAdvanced = advancedHeading.locator(
            'xpath=following::button[@aria-label="menu"][1]',
        )
        await menuFromAdvanced.click()
        // The MenuItem's accessible name is composed from its inner
        // checkbox aria-label ("select" / "selected") + the option
        // string, e.g. "select Basic Filters". A non-anchored regex
        // matches both shapes.
        await page.getByRole('menuitem', { name: /basic filters/i }).click()

        const warningHeading = page.getByText(/advanced search warning/i)
        await expect(warningHeading).toBeVisible({ timeout: 10_000 })

        // Close via the dialog's close button (aria-label="close").
        const dialog = page.getByRole('dialog')
        await dialog.getByRole('button', { name: 'close' }).click()
        await expect(warningHeading).toBeHidden()

        // Closing the warning leaves us in advanced mode (we did not
        // confirm the switch).
        await expect(
            page.getByText('Advanced Filters', { exact: true }).first(),
        ).toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
