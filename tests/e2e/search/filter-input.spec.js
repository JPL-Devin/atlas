import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Filter input flows.
 *
 * Previously the FiltersPanel was only smoke-tested ("does it render?").
 * Real regressions in the filter wiring (Redux dispatch on input,
 * Search/Clear button enabled-state, "Restart search" reset) would not
 * have been caught.
 *
 * The Text Search filter is the simplest filter to drive: it has a
 * single text input plus inline Clear/Search buttons that switch
 * between disabled and enabled based on input length.
 */

test.describe('Filter input - Text Search', () => {
    test('Clear and Search buttons are disabled when input is empty', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const input = page.getByPlaceholder('Search Product Names (regex supported)')
        await expect(input).toBeVisible()

        // The Text Search panel is sticky and has its own Clear / Search
        // buttons inline. Both must be disabled before any text is typed.
        const clearBtn = page.getByRole('button', { name: 'Clear', exact: true })
        const searchBtn = page.getByRole('button', { name: 'Search', exact: true })

        // The user may already see other "Clear" / "Search" buttons elsewhere
        // on the page (e.g. inside a modal). We only care about the ones
        // adjacent to the Text Search input — they should be disabled at
        // page load when the input is empty.
        await expect(clearBtn.first()).toBeDisabled()
        await expect(searchBtn.first()).toBeDisabled()
    })

    test('typing into Text Search enables the Clear and Search buttons', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const input = page.getByPlaceholder('Search Product Names (regex supported)')
        await input.fill('mars')
        await expect(input).toHaveValue('mars')

        const clearBtn = page.getByRole('button', { name: 'Clear', exact: true }).first()
        const searchBtn = page.getByRole('button', { name: 'Search', exact: true }).first()

        await expect(clearBtn).toBeEnabled()
        await expect(searchBtn).toBeEnabled()
    })

    test('Clear button empties the Text Search input and re-disables both buttons', async ({
        page,
    }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const input = page.getByPlaceholder('Search Product Names (regex supported)')
        await input.fill('curiosity')
        await expect(input).toHaveValue('curiosity')

        const clearBtn = page.getByRole('button', { name: 'Clear', exact: true }).first()
        const searchBtn = page.getByRole('button', { name: 'Search', exact: true }).first()
        await expect(clearBtn).toBeEnabled()

        await clearBtn.click()

        await expect(input).toHaveValue('')
        await expect(clearBtn).toBeDisabled()
        await expect(searchBtn).toBeDisabled()
    })

    test('Search button click does not throw a critical JS error', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const input = page.getByPlaceholder('Search Product Names (regex supported)')
        await input.fill('mars')

        const searchBtn = page.getByRole('button', { name: 'Search', exact: true }).first()
        await expect(searchBtn).toBeEnabled()
        await searchBtn.click()

        // Give the dispatch + network round-trip a moment to settle. We
        // don't assert on results because the upstream API may be slow
        // or unreachable; we only assert no critical regressions fired.
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})

test.describe('Filter input - Restart search', () => {
    test('clicking "Restart search" survives without a critical JS error', async ({ page }) => {
        // `Restart search` dispatches `resetFilters()`, which fans out
        // into clearActiveFilters / clearResults / search(). We don't
        // assert on the resulting input/Redux state (that depends on
        // upstream API responses), only that the click survives the
        // round-trip without a critical regression and the page shell
        // remains interactive.
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const input = page.getByPlaceholder('Search Product Names (regex supported)')
        await input.fill('voyager')

        await page.getByRole('button', { name: 'Restart search' }).click()
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

        // Page shell still responds to a noop event — the topbar
        // "navigation" button must remain visible after restart.
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
