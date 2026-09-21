import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Results panel sort control.
 *
 * The ResultsSorter renders a SplitButton (`src/components/SplitButton/SplitButton.js`):
 * a primary `<Button>` whose accessible name is "Sort" (from the
 * startIcon Typography), wrapped in a `<ButtonGroup aria-label="split button">`,
 * plus a chevron `<Button aria-label="button options">` that opens a
 * MenuList of available sort fields.
 *
 * We don't try to assert which sort field changed (that varies with
 * available facets) — instead we verify the user-visible behavior:
 *
 *   1. The primary "Sort" button is reachable and clicking it
 *      doesn't crash (toggles asc/desc).
 *   2. The chevron opens a menu (proves the secondary affordance is
 *      wired). We then close it via Escape so other tests in this
 *      file don't see stale popper DOM.
 */

test.describe('Search - sort control', () => {
    test('the primary Sort button is reachable and survives a click', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // Scope to the ResultsSorter ButtonGroup (aria-label="split button")
        // and pick the primary `<Button>` inside.
        const sortGroup = page.getByRole('group', { name: 'split button' }).first()
        await expect(sortGroup).toBeVisible({ timeout: 20_000 })
        const sortBtn = sortGroup.getByRole('button', { name: /sort/i }).first()
        await expect(sortBtn).toBeVisible({ timeout: 20_000 })
        // Clicking the primary button toggles asc/desc — must not crash.
        await sortBtn.click()
        await expect(sortBtn).toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('the default search sorts by novelty score, highest first', async ({ page }) => {
        const sorts = []

        await page.route(/_search/, async (route) => {
            const body = route.request().postDataJSON()
            if (body?.sort) sorts.push(body.sort)
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ hits: { total: { value: 0 }, hits: [] } }),
            })
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await expect.poll(() => sorts.length, { timeout: 20_000 }).toBeGreaterThan(0)

        const novelty = sorts.find(
            (sort) => sort[0]?.['gather.machine_learning.novelty.score'] != null
        )
        expect(novelty).toBeDefined()
        expect(novelty[0]['gather.machine_learning.novelty.score']).toMatchObject({
            order: 'desc',
            missing: '_last',
        })
    })

    test('sort options show friendly field labels, not raw paths', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const chevron = page.getByRole('button', { name: 'button options' })
        await expect(chevron).toBeVisible({ timeout: 20_000 })
        await chevron.click()

        const novelty = page.getByRole('menuitem', { name: /novelty/i }).first()
        await expect(novelty).toBeVisible({ timeout: 5_000 })
        await expect(novelty).not.toContainText('gather.machine_learning')

        await page.keyboard.press('Escape')
    })

    test('Novelty and Start time lead the sort menu', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const chevron = page.getByRole('button', { name: 'button options' })
        await expect(chevron).toBeVisible({ timeout: 20_000 })
        await chevron.click()

        const options = page.getByRole('menuitem')
        await expect(options.first()).toBeVisible({ timeout: 5_000 })
        await expect(options.nth(0)).toHaveText(/novelty/i)
        await expect(options.nth(1)).toHaveText(/start time/i)
        await expect(page.getByText('Primary', { exact: true })).toBeVisible()

        await page.keyboard.press('Escape')
    })

    test('the chevron next to Sort opens a menu of options', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const chevron = page.getByRole('button', { name: 'button options' })
        await expect(chevron).toBeVisible({ timeout: 20_000 })
        await chevron.click()

        // The popper renders a MenuList with at least one menuitem.
        await expect(page.getByRole('menuitem').first()).toBeVisible({
            timeout: 5_000,
        })

        // Dismiss the popper before leaving the test so other specs
        // don't see stale DOM.
        await page.keyboard.press('Escape')

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
