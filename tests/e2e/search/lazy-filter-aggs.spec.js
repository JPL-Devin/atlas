import { test, expect } from '@playwright/test'
import { waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * Filter aggs are requested separately from results (size: 0 searches) and only
 * for the expanded filter, so slow aggs can't time out the results search.
 */

const MISSION = 'gather.common.mission'

const hitsResponse = () => ({
    took: 1,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] },
})

const MAPPING_URL = 'https://pds-imaging.jpl.nasa.gov/api/search/atlas/_mapping'

const routeSearch = async (page, { failFilterAggs = false } = {}) => {
    // Filters come from the live mapping; proxied so a REACT_APP_DOMAIN without CORS still works
    await page.route(/_mapping/, async (route) => {
        const response = await route.fetch({ url: MAPPING_URL })
        await route.fulfill({
            response,
            headers: { ...response.headers(), 'access-control-allow-origin': '*' },
        })
    })
    const requests = []
    await page.route(/_search/, async (route) => {
        const body = JSON.parse(route.request().postData() || '{}')
        requests.push(body)
        const aggKeys = Object.keys(body.aggs || {})
        if (failFilterAggs && aggKeys.includes(MISSION)) {
            await route.fulfill({
                status: 504,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Endpoint request timed out' }),
            })
            return
        }
        const aggregations = {}
        aggKeys.forEach((key) => {
            aggregations[key] = {
                buckets: key === '_geoGrid' ? [] : [{ key: 'Mars 2020', doc_count: 5 }],
            }
        })
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...hitsResponse(), aggregations }),
        })
    })
    return requests
}

const filterAggRequests = (requests) =>
    requests.filter((r) => Object.keys(r.aggs || {}).some((key) => key[0] !== '_'))

test.describe('Search - lazy filter aggs', () => {
    test('results never carry aggs and a filter loads its agg when expanded', async ({ page }) => {
        const requests = await routeSearch(page)

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(page.getByText('No Records Found')).toBeVisible({ timeout: 30_000 })

        expect(requests.filter((r) => r.size > 0 && r.aggs != null)).toEqual([])
        expect(filterAggRequests(requests)).toEqual([])

        await page.getByText('mission', { exact: true }).first().click()

        await expect(page.getByText('Mars 2020')).toBeVisible({ timeout: 15_000 })
        const aggRequests = filterAggRequests(requests)
        expect(aggRequests).toHaveLength(1)
        expect(aggRequests[0].size).toBe(0)
        expect(Object.keys(aggRequests[0].aggs)).toEqual([MISSION])
    })

    test('a removed and re-added filter loads its values again', async ({ page }) => {
        const requests = await routeSearch(page)

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(page.getByText('No Records Found')).toBeVisible({ timeout: 30_000 })

        await page.getByText('mission', { exact: true }).first().click()
        await expect(page.getByText('Mars 2020')).toBeVisible({ timeout: 15_000 })

        await page.getByRole('button', { name: 'remove mission filter' }).click()
        await expect(page.getByText('Mars 2020')).toHaveCount(0)

        // Re-adding is served from the cache, so the searching overlay should never appear
        await page.evaluate(() => {
            window.__sawSearching = false
            new MutationObserver(() => {
                if (document.body.textContent.includes('Searching')) {
                    window.__sawSearching = true
                }
            }).observe(document.body, { childList: true, subtree: true, characterData: true })
        })

        await page.getByRole('button', { name: 'add filter' }).click()
        const dialog = page.getByRole('dialog')
        await page.getByPlaceholder('Find Filter').fill('mission')
        await dialog.getByRole('treeitem', { name: 'Common' }).click()
        await dialog
            .getByRole('treeitem', { name: /info mission$/ })
            .getByRole('checkbox')
            .click()
        await expect(dialog.getByText('1 new filter selected')).toBeVisible()
        await page.getByRole('button', { name: /add selected filters/i }).click()
        await expect(dialog).not.toBeVisible({ timeout: 5_000 })

        await expect(page.getByText('Mars 2020')).toBeVisible({ timeout: 15_000 })
        // Same query and agg, so the values come from the search cache
        expect(filterAggRequests(requests)).toHaveLength(1)
        expect(await page.evaluate(() => window.__sawSearching)).toBe(false)
    })

    test('a failed filter agg shows a retry without failing the search', async ({ page }) => {
        await routeSearch(page, { failFilterAggs: true })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(page.getByText('No Records Found')).toBeVisible({ timeout: 30_000 })

        await page.getByText('mission', { exact: true }).first().click()

        await expect(page.getByText("Couldn't load values for this filter.")).toBeVisible({
            timeout: 15_000,
        })
        await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
        await expect(page.getByText('No Records Found')).toBeVisible()
    })
})
