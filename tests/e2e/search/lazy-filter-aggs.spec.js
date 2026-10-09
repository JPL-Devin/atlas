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

const routeSearch = async (
    page,
    { failFilterAggs = false, filterAggDelay = 0, geoGrid = [] } = {}
) => {
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
        if (filterAggDelay && aggKeys.includes(MISSION)) {
            await new Promise((resolve) => setTimeout(resolve, filterAggDelay))
        }
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
                buckets:
                    key === '_geoGrid'
                        ? geoGrid
                        : key === '_activeMissions'
                          ? []
                          : [{ key: 'Mars 2020', doc_count: 5 }],
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

const secondaryAggRequests = (requests) =>
    requests.filter((r) => Object.keys(r.aggs || {}).includes('_activeMissions'))

const readdMissionFilter = async (page) => {
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
}

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

    test('an expanded filter opens once its values load, or after a short wait', async ({
        page,
    }) => {
        await routeSearch(page, { filterAggDelay: 3_000 })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(page.getByText('No Records Found')).toBeVisible({ timeout: 30_000 })

        const summary = page
            .locator('[aria-expanded]')
            .filter({ has: page.getByText('mission', { exact: true }) })
        await page.getByText('mission', { exact: true }).first().click()

        await expect(page.getByRole('progressbar', { name: 'Loading filter values' })).toBeVisible()
        await expect(summary).toHaveAttribute('aria-expanded', 'false')
        // Opens with placeholder rows when the values take too long
        await expect(summary).toHaveAttribute('aria-expanded', 'true', { timeout: 2_000 })
        await expect(page.getByText('Mars 2020')).toBeVisible({ timeout: 15_000 })
        await expect(page.getByRole('progressbar', { name: 'Loading filter values' })).toHaveCount(
            0
        )
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

        await readdMissionFilter(page)

        await expect(page.getByText('Mars 2020')).toBeVisible({ timeout: 15_000 })
        // Same query and agg, so the values come from the search cache
        expect(filterAggRequests(requests)).toHaveLength(1)
        expect(await page.evaluate(() => window.__sawSearching)).toBe(false)
    })

    test('a filter removed while loading loads its values again when re-added', async ({
        page,
    }) => {
        await routeSearch(page, { filterAggDelay: 2_000 })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(page.getByText('No Records Found')).toBeVisible({ timeout: 30_000 })

        await page.getByText('mission', { exact: true }).first().click()
        await expect(page.getByRole('progressbar', { name: 'Loading filter values' })).toBeVisible()
        await page.getByRole('button', { name: 'remove mission filter' }).click()
        // Let the removed filter's response arrive
        await page.waitForTimeout(2_500)

        await readdMissionFilter(page)
        const summary = page
            .locator('[aria-expanded]')
            .filter({ has: page.getByText('mission', { exact: true }) })
        if ((await summary.getAttribute('aria-expanded')) !== 'true') {
            await page.getByText('mission', { exact: true }).first().click()
        }
        await expect(page.getByText('Mars 2020')).toBeVisible({ timeout: 15_000 })
    })

    test('mission and map aggs are only requested while the map is open', async ({ page }) => {
        const requests = await routeSearch(page)

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(page.getByText('No Records Found')).toBeVisible({ timeout: 30_000 })
        expect(secondaryAggRequests(requests)).toEqual([])

        await page.getByRole('tab', { name: 'Map', exact: true }).click()
        await expect.poll(() => secondaryAggRequests(requests).length).toBe(1)
        expect(secondaryAggRequests(requests)[0].size).toBe(0)

        // Same query, so reopening the map doesn't request them again
        await page.getByRole('tab', { name: 'Grid', exact: true }).click()
        await page.getByRole('tab', { name: 'Map', exact: true }).click()
        await page.waitForTimeout(500)
        expect(secondaryAggRequests(requests)).toHaveLength(1)
    })

    test('reopening the map after returning to an earlier query shows its heatmap', async ({
        page,
    }) => {
        await routeSearch(page, { geoGrid: [{ key: '9q', doc_count: 5 }] })
        const heatmapCells = () => page.evaluate(() => window.geoGridLayer?.getLayers().length ?? 0)

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await expect(page.getByText('No Records Found')).toBeVisible({ timeout: 30_000 })
        await page.getByRole('tab', { name: 'Map', exact: true }).click()
        // The map is only created once a body is picked
        await page.getByText('Target Bodies', { exact: true }).click()
        await page.getByRole('option', { name: 'Mars', exact: true }).click()
        await expect(page.locator('.leaflet-container').first()).toBeVisible()

        // Close the map, change the query, then return to the first query
        await page.getByRole('tab', { name: 'Grid', exact: true }).click()
        await page.getByText('mission', { exact: true }).first().click()
        const mars = page.getByText('Mars 2020', { exact: true })
        await mars.click()
        await expect(page.getByRole('button', { name: /clear/i }).first()).toBeVisible()
        await mars.click()

        await page.getByRole('tab', { name: 'Map', exact: true }).click()
        await expect.poll(heatmapCells).toBe(1)
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
