import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Deeper /record page coverage:
 *
 *   1. Tab switching (Overview <-> Product Label)
 *   2. OpenSeadragon viewer controls (home / fullscreen / rotate / zoom)
 *   3. "return to search" button navigates back to /search
 *   4. "copy link to record page" button is reachable
 *
 * The record page is opened by clicking a result on /search. We rely
 * on the same pattern as `tests/e2e/integration/search-to-cart.spec.js`
 * — wait for `.GridViewMasonryItem`, click the first one, wait for
 * `/record?uri=…`. If no result renders within the budget, the test
 * gracefully self-skips so the suite is safe in network-restricted CI.
 */

const SHORT_RESULT_WAIT_MS = 20_000

async function openFirstRecordFromSearch(page) {
    await page.goto('/search', { waitUntil: 'domcontentloaded' })
    await waitForAppReady(page)

    const firstCard = page.locator('.GridViewMasonryItem').first()
    try {
        await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
    } catch {
        test.skip(true, 'No search results rendered — Atlas API likely unreachable.')
    }
    await firstCard.click()
    await page.waitForURL((u) => u.pathname.includes('/record'), { timeout: 30_000 })
}

test.describe('/record - tab switching', () => {
    test('Overview tab is selected by default and Product Label is unselected', async ({
        page,
    }) => {
        await openFirstRecordFromSearch(page)

        const overviewTab = page.getByRole('tab', { name: 'Overview', exact: true })
        const productLabelTab = page.getByRole('tab', { name: 'Product Label', exact: true })

        await expect(overviewTab).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })
        await expect(overviewTab).toHaveAttribute('aria-selected', 'true')
        await expect(productLabelTab).toHaveAttribute('aria-selected', 'false')
    })

    test('clicking Product Label flips selection from Overview to Product Label', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await openFirstRecordFromSearch(page)

        const overviewTab = page.getByRole('tab', { name: 'Overview', exact: true })
        const productLabelTab = page.getByRole('tab', { name: 'Product Label', exact: true })

        await productLabelTab.click()
        await expect(productLabelTab).toHaveAttribute('aria-selected', 'true')
        await expect(overviewTab).toHaveAttribute('aria-selected', 'false')

        // And back, verifying tab state is bidirectional.
        await overviewTab.click()
        await expect(overviewTab).toHaveAttribute('aria-selected', 'true')

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})

test.describe('/record - OpenSeadragon viewer controls', () => {
    const VIEWER_CONTROLS = [
        'image view home',
        'image view rotate counter clockwise',
        'image view rotate clockwise',
        'image view zoom in',
        'image view zoom out',
    ]

    for (const label of VIEWER_CONTROLS) {
        test(`viewer control "${label}" is reachable and survives a click`, async ({ page }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))

            await openFirstRecordFromSearch(page)

            const btn = page.getByRole('button', { name: label })
            await expect(btn).toBeVisible({ timeout: SHORT_RESULT_WAIT_MS })
            await btn.click()

            expect(filterCriticalJsErrors(errors)).toEqual([])
        })
    }

    test('image view fullscreen button is reachable (NOT clicked to avoid Playwright fullscreen flakiness)', async ({
        page,
    }) => {
        await openFirstRecordFromSearch(page)
        await expect(page.getByRole('button', { name: 'image view fullscreen' })).toBeVisible({
            timeout: SHORT_RESULT_WAIT_MS,
        })
    })
})

test.describe('/record - secondary controls', () => {
    test('"return to search" navigates back to /search', async ({ page }) => {
        await openFirstRecordFromSearch(page)

        // The aria-label conditionally toggles between 'go back a page'
        // and 'return to search' depending on history state. Match either.
        const back = page
            .getByRole('button', { name: 'return to search' })
            .or(page.getByRole('button', { name: 'go back a page' }))
        await back.first().click()
        await page.waitForURL((u) => u.pathname.includes('/search'), { timeout: 30_000 })
        expect(page.url()).toContain('/search')
    })

    test('"copy link to record page" button is reachable', async ({ page }) => {
        // Don't actually assert clipboard contents — that requires
        // additional Chrome permissions that vary by environment. We
        // verify the affordance exists.
        await openFirstRecordFromSearch(page)
        await expect(page.getByRole('button', { name: 'copy link to record page' })).toBeVisible()
    })

    test('Download dropdown trigger is visible but is NOT clicked', async ({ page }) => {
        // Same safety rule as elsewhere — the Download button on /record
        // can fetch the underlying product file, which may be very
        // large. Confirm it renders, never click it.
        await openFirstRecordFromSearch(page)
        await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible()
    })
})
