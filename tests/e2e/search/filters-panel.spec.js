import { test, expect } from '@playwright/test'
import { navigateToSearch } from '../../helpers/atlas-helpers.js'

test.describe('Search - Filters Panel', () => {
    test('filters panel "add filter" button is visible on desktop', async ({ page }) => {
        await navigateToSearch(page)
        // The FiltersPanel renders a Fab with aria-label="add filter".
        await expect(page.getByRole('button', { name: 'add filter' })).toBeVisible()
    })

    test('filters panel toggle in toolbar is reachable', async ({ page }) => {
        await navigateToSearch(page)
        await expect(page.getByRole('button', { name: 'filters panel' })).toBeVisible()
    })
})
