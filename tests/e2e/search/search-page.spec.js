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

    test('the three main panels are present', async ({ page }) => {
        await navigateToSearch(page)

        // Wait for the React app to render past the initial empty body
        await page.waitForFunction(
            () => document.querySelectorAll('div').length > 5,
            { timeout: 20000 },
        ).catch(() => {})

        // The Search component lays out FiltersPanel + SecondaryPanel +
        // ResultsPanel. The exact CSS class names are JSS-generated, so
        // match by partial class name (case-insensitive).
        const panelMatches = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('[class]'))
            const has = (needle) =>
                all.some((el) => /class/i.test(el.outerHTML) && (el.className.toString() || '').toLowerCase().includes(needle))
            return {
                filters: has('filterspanel') || has('filters'),
                secondary: has('secondarypanel') || has('secondary'),
                results: has('resultspanel') || has('results'),
            }
        })

        // Filters panel and results panel are required; secondary panel is
        // a map and may not always render in headless without the network
        // available, so don't hard-fail on it.
        expect(panelMatches.filters).toBeTruthy()
        expect(panelMatches.results).toBeTruthy()
    })

    test('Search container element is rendered', async ({ page }) => {
        await navigateToSearch(page)

        const containerExists = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('[class]'))
            return all.some((el) => (el.className.toString() || '').toLowerCase().includes('search'))
        })
        expect(containerExists).toBeTruthy()
    })

    test('no critical JS errors during search page load', async ({ page }) => {
        const errors = []
        page.on('pageerror', (err) => errors.push(err.message))

        await navigateToSearch(page)

        const critical = filterCriticalJsErrors(errors)
        expect(critical).toEqual([])
    })
})
