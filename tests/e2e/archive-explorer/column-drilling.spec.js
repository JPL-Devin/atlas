import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Archive Explorer column drilling and Regex modal.
 *
 * `file-explorer.spec.js` only verifies the page renders. It doesn't
 * exercise the column-based drilling that is the entire point of this
 * route. This spec covers:
 *
 *   1. Clicking a mission name in the Missions column drills into a
 *      second column ("Bundles(PDS4)" or similar) and updates the URL.
 *   2. The breadcrumb path reflects the selected mission.
 *   3. The "Reset path" button collapses the path back to "/".
 *   4. The "regex" button on each column opens the URI Regex Search
 *      modal, which can be closed.
 *
 * Drilling depends on the upstream PDS API returning a non-empty list
 * of missions. If the Missions column never populates, the test
 * gracefully self-skips.
 */

const MISSION_LIST_WAIT_MS = 20_000
const KNOWN_MISSION = 'Mars 2020'

async function waitForMissionsToLoad(page) {
    // The first column header is rendered as <h6>Missions</h6>. Wait
    // until the API populates list items beneath it. We use a known
    // mission name as the canary because it is virtually guaranteed to
    // exist in the PDS data.
    const missionItem = page.locator('li', { hasText: KNOWN_MISSION }).first()
    try {
        await missionItem.waitFor({ state: 'visible', timeout: MISSION_LIST_WAIT_MS })
    } catch {
        test.skip(true, `Missions column never populated "${KNOWN_MISSION}" — API likely down.`)
    }
    return missionItem
}

test.describe('Archive Explorer - column drilling', () => {
    test('clicking a mission updates the URL with ?mission=…', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const mars = await waitForMissionsToLoad(page)
        await mars.click()

        await page.waitForURL((u) => u.search.includes('mission='), { timeout: 30_000 })
        expect(page.url()).toContain('mission=')

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('clicking a mission renders a second column with bundles or volumes', async ({
        page,
    }) => {
        await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const mars = await waitForMissionsToLoad(page)
        await mars.click()

        // The second column is headed by either "Bundles(PDS4)" or
        // "Volumes(PDS3)" depending on the standard. Either is a valid
        // signal that drilling worked.
        const bundlesHeader = page.getByRole('heading', { name: 'Bundles(PDS4)' })
        const volumesHeader = page.getByRole('heading', { name: 'Volumes(PDS3)' })
        await expect(bundlesHeader.or(volumesHeader).first()).toBeVisible({
            timeout: MISSION_LIST_WAIT_MS,
        })
    })

    test('"Reset path" button collapses the breadcrumb back to "/"', async ({ page }) => {
        await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const mars = await waitForMissionsToLoad(page)
        await mars.click()
        await page.waitForURL((u) => u.search.includes('mission='), { timeout: 30_000 })

        await page.getByRole('button', { name: 'Reset path' }).click()
        // The breadcrumb header h4 is "/" when no mission is selected.
        await expect(page.locator('h4', { hasText: '/' }).first()).toBeVisible()
    })
})

test.describe('Archive Explorer - Regex modal', () => {
    test('clicking the regex button opens "URI Regex Search" modal', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const mars = await waitForMissionsToLoad(page)
        await mars.click()

        // The regex button only renders on columns deeper than Missions.
        const regexBtn = page.getByRole('button', { name: 'regex', exact: true }).first()
        await expect(regexBtn).toBeVisible({ timeout: MISSION_LIST_WAIT_MS })
        await regexBtn.click()

        await expect(page.getByRole('heading', { name: 'URI Regex Search' })).toBeVisible()

        // Close it via the dialog's close button.
        const closeBtn = page.getByRole('button', { name: 'close', exact: true }).first()
        await closeBtn.click()
        await expect(page.getByRole('heading', { name: 'URI Regex Search' })).not.toBeVisible()

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('Regex modal exposes an input, a Search button, and Add All to Cart (NOT clicked)', async ({
        page,
    }) => {
        await page.goto('/archive-explorer', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const mars = await waitForMissionsToLoad(page)
        await mars.click()

        const regexBtn = page.getByRole('button', { name: 'regex', exact: true }).first()
        await expect(regexBtn).toBeVisible({ timeout: MISSION_LIST_WAIT_MS })
        await regexBtn.click()

        await expect(page.getByPlaceholder('Enter a Regular Expression')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeVisible()

        // The "Add All Results to Cart" button can dump millions of
        // products into the cart. We assert it is *reachable* but never
        // click it.
        await expect(page.getByRole('button', { name: 'Add All Results to Cart' })).toBeVisible()
    })
})
