import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Empty / zero-result state.
 *
 * The ResultsStatus subcomponent renders "No Records Found" with an
 * advisory message when the search returns zero results
 * (resultsStatuses.NONE in
 * `src/pages/Search/Panels/ResultsPanel/subcomponents/ResultsStatus/ResultsStatus.js`).
 *
 * We force this state deterministically by intercepting the
 * Elasticsearch _search response and rewriting it to a zero-hits
 * payload — that way the test does not depend on the live PDS API
 * behaving any particular way.
 */

const EMPTY_HITS_RESPONSE = {
    took: 1,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
        total: { value: 0, relation: 'eq' },
        max_score: null,
        hits: [],
    },
    aggregations: {},
}

test.describe('Search - empty result state', () => {
    test('"No Records Found" message renders when the API returns zero hits', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Intercept any *_search request and respond with an empty-hits
        // payload so we can deterministically drive the NONE status.
        await page.route(/_search/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(EMPTY_HITS_RESPONSE),
            })
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await expect(page.getByText('No Records Found')).toBeVisible({ timeout: 30_000 })
        await expect(
            page.getByText(/review your query|broaden the search/i),
        ).toBeVisible()

        // Even with zero results the page shell must remain interactive.
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
