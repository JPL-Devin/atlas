import { test, expect } from '@playwright/test'
import { navigateToSearch } from '../../helpers/atlas-helpers.js'

test.describe('Search - Filters Panel', () => {
    test('filters panel "add filter" button is visible on desktop', async ({ page }) => {
        await navigateToSearch(page)
        // The FiltersPanel renders a Fab with aria-label="add filter".
        await expect(page.getByRole('button', { name: 'add filter' })).toBeVisible()
    })

    test('the results heading has no filters toggle', async ({ page }) => {
        await navigateToSearch(page)

        // The sidebar is always shown on desktop; phones switch via the bottom bar
        await expect(page.getByRole('button', { name: 'filters', exact: true })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'add filter' })).toBeVisible()
    })

    test('"Reset filters" is an icon button right of the filters title', async ({ page }) => {
        await navigateToSearch(page)

        const reset = page.getByRole('button', { name: 'reset filters', exact: true })
        await expect(reset).toBeVisible()
        await expect(reset).toHaveText('')

        const resetBox = await reset.boundingBox()
        const titleBox = await page.getByText('Basic Filters', { exact: true }).boundingBox()
        expect(resetBox.x).toBeGreaterThan(titleBox.x)
    })
})
