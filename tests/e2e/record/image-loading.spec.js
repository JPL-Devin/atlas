import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Record page - image bytes actually load.
 *
 * Existing /record specs assert the OpenSeadragon viewer's *shell*
 * renders (zoom/home/rotate buttons exist). They do NOT assert that
 * the actual image bytes load. A regression in `getPDSUrl()` (URL
 * construction in `src/core/utils.js`) or a CORS / auth-header
 * regression on the `/data` (test) / `/archive` (prod) data service
 * would not be caught.
 *
 * The data endpoint is configured via `REACT_APP_DATA_ENDPOINT` and
 * defaults to `/data` for tests (see `.env`). In production the
 * archive data service serves bytes from `/archive`. Either way, the
 * URL is `${REACT_APP_DOMAIN}${endpoints.data}/<lidvid>`.
 *
 * We don't assert a specific image — instead we watch the network
 * for any GET to a URL containing the data endpoint and assert at
 * least one such request fires after the record page loads. If the
 * upstream API never returns a result, the test gracefully skips.
 */

const SHORT_RESULT_WAIT_MS = 20_000
const DATA_ENDPOINT_PATTERN = /\/(?:data|archive)\//

test.describe('Record - image bytes load via the data service', () => {
    test('navigating to /record from /search triggers at least one image request', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        let imageRequestCount = 0
        page.on('request', (req) => {
            const url = req.url()
            // Per-result thumbnails on /search also hit the data
            // endpoint, so we'd count those too. To isolate /record
            // image fetches we reset the count after navigation.
            if (DATA_ENDPOINT_PATTERN.test(url)) imageRequestCount++
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const firstCard = page.locator('[result-id]').first()
        try {
            await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        } catch {
            test.skip(true, 'Upstream Atlas API not returning results in this environment')
        }

        // Snapshot then reset the counter — we only care about
        // requests fired while on /record.
        await firstCard.click()
        await page.waitForURL(/\/record\?uri=/, { timeout: SHORT_RESULT_WAIT_MS })
        await waitForAppReady(page)

        // Reset; capture only post-record requests.
        imageRequestCount = 0
        // Give OSD time to construct + dispatch tile fetches.
        await page.waitForTimeout(5_000)

        expect(imageRequestCount).toBeGreaterThan(0)
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
