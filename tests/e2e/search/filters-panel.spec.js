import { test, expect } from '@playwright/test'
import { navigateToSearch } from '../../helpers/atlas-helpers.js'

test.describe('Search - Filters Panel', () => {
    test('filters panel "add filter" button is visible on desktop', async ({ page }) => {
        await navigateToSearch(page)
        // The FiltersPanel renders a Fab with aria-label="add filter".
        await expect(page.getByRole('button', { name: 'add filter' })).toBeVisible()
    })

    test('the Filters button in the results heading hides and shows the sidebar', async ({
        page,
    }) => {
        await navigateToSearch(page)

        const filters = page.getByRole('button', { name: 'filters', exact: true })
        await expect(filters).toBeVisible()
        await expect(filters).toHaveAttribute('aria-pressed', 'true')

        await filters.click()
        await expect(filters).toHaveAttribute('aria-pressed', 'false')
        await expect(page.getByRole('button', { name: 'add filter' })).toBeHidden()

        await filters.click()
        await expect(filters).toHaveAttribute('aria-pressed', 'true')
        await expect(page.getByRole('button', { name: 'add filter' })).toBeVisible()
    })

    test('"Reset filters" lives in the filters heading', async ({ page }) => {
        await navigateToSearch(page)
        await expect(page.getByRole('button', { name: 'reset filters', exact: true })).toBeVisible()
    })
})
