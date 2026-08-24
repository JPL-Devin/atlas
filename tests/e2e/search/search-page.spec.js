import { test, expect } from '@playwright/test'
import { navigateToSearch, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

test.describe('Search Page', () => {
    test('search page loads at /search', async ({ page }) => {
        await navigateToSearch(page)
        const url = page.url()
        expect(url).toContain('/search')
    })

    test('page title contains "Atlas"', async ({ page }) => {
        await navigateToSearch(page)
        const title = await page.title()
        expect(title.toLowerCase()).toContain('atlas')
    })

    test('Topbar renders with the ATLAS heading and "Image Search" page name', async ({ page }) => {
        await navigateToSearch(page)
        await expect(page.locator('h1', { hasText: 'ATLAS' })).toBeVisible()
        await expect(page.locator('h2', { hasText: /image search/i })).toBeVisible()
    })

    test('Results heading exposes the Filters button and the view tabs', async ({ page }) => {
        await navigateToSearch(page)
        await expect(page.getByRole('button', { name: 'filters', exact: true })).toBeVisible()
        for (const name of ['Grid', 'List', 'Table', 'Map']) {
            await expect(page.getByRole('tab', { name, exact: true })).toBeVisible()
        }
    })

    test('Topbar exposes navigation buttons to other routes', async ({ page }) => {
        await navigateToSearch(page)
        await expect(page.getByRole('button', { name: /go to image search/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /go to archive explorer/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /go to cart/i })).toBeVisible()
    })

    test('no critical JS errors during search page load', async ({ page }) => {
        const errors = []
        page.on('pageerror', (err) => errors.push(err.message))

        await navigateToSearch(page)

        const critical = filterCriticalJsErrors(errors)
        expect(critical).toEqual([])
    })
})
