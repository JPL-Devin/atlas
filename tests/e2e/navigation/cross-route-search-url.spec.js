import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Entering /search from another route must not pick up that route's
 * query string.
 *
 * The Archive Explorer file deep link (`/archive-explorer?uri=<atlas uri>-`)
 * and the record page (`/record?uri=<atlas uri>`) both use a `uri` param,
 * which is also a valid Search filter key. The first search must only read
 * filters from the /search URL it actually mounted on, so clicking the
 * Topbar "Image Search" button from those pages lands on the broad search.
 *
 * Only the Topbar navigation buttons are clicked — never any download /
 * add-to-cart affordance.
 */

const FILE_URI =
    'atlas:pds4:artemis2:artemis2:/artemis2_crew_camera/data_processed/fd05/art002e024156_nkd5015_prc_v01.tif'

const SEARCH_SETTLE_MS = 60_000

/**
 * SPA navigations don't reset Playwright's `networkidle`, so wait for the
 * Search results status to leave "Searching" instead.
 *
 * @returns {Promise<boolean>} true if the search settled with results
 */
async function waitForSearchSettled(page) {
    const firstResult = page.locator('[result-id]').first()
    const settled = firstResult
        .or(page.getByText('No Records Found'))
        .or(page.getByText('Search Error'))
        .first()
    await settled.waitFor({ state: 'visible', timeout: SEARCH_SETTLE_MS }).catch(() => {})
    return firstResult.isVisible()
}

const START_PAGES = [
    { name: 'Archive Explorer file deep link', path: `/archive-explorer?uri=${FILE_URI}-&pds=4` },
    { name: 'record page', path: `/record?uri=${FILE_URI}` },
]

test.describe('Navigation - entering /search from another route', () => {
    for (const { name, path } of START_PAGES) {
        test(`Image Search from a freshly loaded ${name} opens the broad search`, async ({
            page,
        }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))

            await page.goto(path, { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)

            await page.getByRole('button', { name: 'go to image search' }).click()
            await page.waitForURL(/\/search/)
            await waitForSearchSettled(page)

            const url = new URL(page.url())
            expect(url.pathname).toBe('/search')
            expect(url.searchParams.has('uri')).toBe(false)
            expect(url.searchParams.has('pds')).toBe(false)

            expect(filterCriticalJsErrors(errors)).toEqual([])
        })
    }

    test('Search filters survive a round trip through the Archive Explorer', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search?_text=mars', { waitUntil: 'domcontentloaded' })
        if (!(await waitForSearchSettled(page))) {
            test.skip(true, 'Upstream Atlas API not returning results in this environment')
        }
        await expect(page).toHaveURL(/[?&]_text=mars/)
        const settledSearchURL = page.url()

        await page.getByRole('button', { name: 'go to archive explorer' }).click()
        await page.waitForURL(/\/archive-explorer/)
        await waitForAppReady(page)

        await page.getByRole('button', { name: 'go to image search' }).click()
        await expect(page).toHaveURL(settledSearchURL)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
