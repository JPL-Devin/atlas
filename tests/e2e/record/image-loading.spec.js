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

        await firstCard.click()
        await page.waitForURL(/\/record\?uri=/, { timeout: SHORT_RESULT_WAIT_MS })

        // Reset immediately after the URL change and BEFORE
        // `waitForAppReady` — that helper waits for `networkidle`
        // (500ms with no in-flight requests), so any OSD tile
        // requests that fire during the page's settling window would
        // already be counted-then-discarded if we reset afterwards.
        imageRequestCount = 0
        await waitForAppReady(page)

        // Give OSD a little extra to dispatch tile fetches in case
        // they trail the networkidle window.
        await page.waitForTimeout(2_000)

        expect(imageRequestCount).toBeGreaterThan(0)
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
