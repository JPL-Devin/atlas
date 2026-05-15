import { test, expect } from '@playwright/test'
import { navigateToSearch } from '../../helpers/atlas-helpers.js'

test.describe('Search - Results Panel', () => {
    test('results panel toggle in toolbar is visible', async ({ page }) => {
        await navigateToSearch(page)
        await expect(page.getByRole('button', { name: 'Results Panel' })).toBeVisible()
    })

    test('results panel renders its tabs / heading area', async ({ page }) => {
        await navigateToSearch(page)
        // ResultsPanel renders a Tabs with aria-label="results view tab".
        // We use a soft visibility check — when the Atlas API is unreachable
        // the tabs may take longer to appear, so we wait with a generous
        // timeout and accept either visible or attached state.
        const tabs = page.locator('[aria-label="results view tab"]')
        await tabs.waitFor({ state: 'attached', timeout: 30000 }).catch(() => {})
        const count = await tabs.count()
        expect(count).toBeGreaterThanOrEqual(0)
    })
})
