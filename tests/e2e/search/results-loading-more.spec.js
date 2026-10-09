import { test, expect } from '@playwright/test'
import { waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * Loading the next page shows a small box at the bottom-right of the results,
 * where the user's eyes are while scrolling, instead of the center overlay.
 */

const record = {
    gather: {
        common: { mission: 'artemis2', spacecraft: 'artemis2', kind: 'regular', target: ['moon'] },
        pds_archive: { file_name: 'art002e031160_saw3_raw_v01.tif', pds_standard: 'pds4' },
    },
}
const MAPPING_URL = 'https://pds-imaging.jpl.nasa.gov/api/search/atlas/_mapping'
const TOTAL = 1000

const hitsPage = (from, size) => ({
    took: 1,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
        total: { value: TOTAL, relation: 'eq' },
        max_score: null,
        hits: Array.from({ length: size }, (_, i) => ({
            _index: 'atlas',
            _id: `record-${from + i}`,
            _score: null,
            _source: record,
        })),
    },
})

const routeSearch = async (page, nextPageDelay) => {
    await page.route(/_mapping/, async (route) => {
        const response = await route.fetch({ url: MAPPING_URL })
        await route.fulfill({
            response,
            headers: { ...response.headers(), 'access-control-allow-origin': '*' },
        })
    })
    await page.route(/_search/, async (route) => {
        const body = JSON.parse(route.request().postData() || '{}')
        if (body.size === 0) {
            await route.fulfill({ json: { ...hitsPage(0, 0), aggregations: {} } })
            return
        }
        const from = body.from || 0
        if (from > 0) {
            await new Promise((resolve) => setTimeout(resolve, nextPageDelay))
        }
        await route.fulfill({ json: hitsPage(from, body.size) })
    })
}

test.describe('Search - loading more results', () => {
    test('the next page shows a loading box at the bottom-right of the results', async ({
        page,
    }) => {
        await routeSearch(page, 2_000)
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        await page.getByRole('tab', { name: 'List', exact: true }).click()

        const views = page.locator('[result-id]').first()
        await expect(views).toBeVisible({ timeout: 30_000 })
        const loading = page.getByRole('status', { name: 'Loading more results' })
        await expect(loading).toHaveCount(0)

        // The virtualized list grows as it renders, so keep scrolling until the next page is asked for
        await expect(async () => {
            await page.locator('#ListViewContent').evaluate((el) => {
                el.scrollTop = el.scrollHeight
            })
            await expect(loading).toBeVisible({ timeout: 300 })
        }).toPass({ timeout: 10_000 })

        const box = await loading.boundingBox()
        const viewport = page.viewportSize()
        expect(box.y).toBeGreaterThan(viewport.height / 2)
        expect(box.x).toBeGreaterThan(viewport.width / 2)
        await expect(page.getByText('Searching')).toHaveCount(0)

        await expect(loading).toHaveCount(0, { timeout: 10_000 })
    })
})
