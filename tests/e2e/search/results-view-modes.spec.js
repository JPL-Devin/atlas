import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Results panel view-mode tabs and inline controls.
 *
 * The ResultsPanel offers three rendering modes — `grid`, `list`,
 * and `table` — switched by a tab strip at the top of the panel. It
 * also exposes:
 *
 *   - three image-size buttons (small / medium / large)
 *   - a "rotate images" button
 *   - a "Sort" menu
 *
 * These controls all dispatch Redux state changes and a regression in
 * any of them would silently degrade the search UX. We don't assert on
 * the resulting content (which depends on API data) — we only assert
 * the click survives without a critical JS error and that the visual
 * `aria-selected` state moves to the new tab.
 */

const SHORT_RESULT_WAIT_MS = 20_000

test.describe('Results panel - view modes', () => {
    test('grid view tab is selected by default', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const gridTab = page.getByRole('tab', { name: 'grid', exact: true })
        await expect(gridTab).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })
        await expect(gridTab).toHaveAttribute('aria-selected', 'true')
    })

    test('clicking the list tab marks list as selected and grid as unselected', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const listTab = page.getByRole('tab', { name: 'list', exact: true })
        await expect(listTab).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })

        await listTab.click()
        await expect(listTab).toHaveAttribute('aria-selected', 'true')
        await expect(page.getByRole('tab', { name: 'grid', exact: true })).toHaveAttribute(
            'aria-selected',
            'false',
        )

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('clicking the table tab marks table as selected', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const tableTab = page.getByRole('tab', { name: 'table', exact: true })
        await expect(tableTab).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })
        await tableTab.click()
        await expect(tableTab).toHaveAttribute('aria-selected', 'true')

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('cycling through grid -> list -> table -> grid leaves the page interactive', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        for (const name of ['list', 'table', 'grid']) {
            const tab = page.getByRole('tab', { name, exact: true })
            await tab.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
            await tab.click()
            await expect(tab).toHaveAttribute('aria-selected', 'true')
        }

        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})

test.describe('Results panel - inline controls', () => {
    test('image-size buttons (small / medium / large) are present and clickable', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        for (const label of ['small image size', 'medium image size', 'large image size']) {
            const btn = page.getByRole('button', { name: label })
            await expect(btn).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })
            await btn.click()
        }

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('rotate images button is reachable and survives a click', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const rotate = page.getByRole('button', { name: 'rotate images' })
        await expect(rotate).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })
        await rotate.click()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('"Add All to Cart" button is reachable but is NOT clicked (would queue bulk download)', async ({
        page,
    }) => {
        // Deliberately *only* assert visibility. Clicking this button
        // would stage every result in the cart, which is exactly the
        // class of action we were asked to keep out of the test suite.
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const addAll = page.getByRole('button', { name: 'add all query results to cart' })
        await expect(addAll).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })
    })
})
