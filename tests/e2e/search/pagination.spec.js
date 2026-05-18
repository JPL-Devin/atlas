import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Results panel pagination (infinite scroll).
 *
 * Atlas does not expose a "next page" button — instead, the GridView
 * (Masonic `useInfiniteLoader`) and TableView (`react-virtualized
 * InfiniteLoader`) trigger additional searches as the user scrolls
 * near the edge of the rendered list.
 *
 * The deeper search is driven by Elasticsearch's PIT (Point-In-Time)
 * mechanism: a follow-up `_search` request fires after the initial
 * one, with a `pit.id` payload and a `search_after` cursor. We assert
 * that scrolling actually triggers at least one additional `_search`
 * request — that's the user-visible regression surface (silent
 * pagination breakage = "I scroll forever and never get more
 * results").
 *
 * Live API dependency: this test relies on the live Atlas API
 * returning at least one page of results so there's something to
 * scroll. If no result renders within the budget, the test
 * gracefully self-skips.
 */

const SHORT_RESULT_WAIT_MS = 20_000

test.describe('Search - results pagination', () => {
    test('scrolling the results panel triggers a follow-up _search request', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Count `_search` requests so we can verify a *second* one
        // fires after the initial query as we scroll.
        let searchRequestCount = 0
        page.on('request', (req) => {
            if (req.url().includes('_search')) searchRequestCount++
        })

        // Capture the response so we can decide whether pagination
        // is even *possible* (`hits.total.value > hits.hits.length`).
        // If it isn't, skip — there's no second page to load.
        let initialTotalKnown = null
        let initialReturned = null
        page.on('response', async (res) => {
            if (initialReturned != null) return
            if (!res.url().includes('_search')) return
            try {
                const body = await res.json()
                const total = body?.hits?.total?.value ?? body?.hits?.total
                const returned = body?.hits?.hits?.length
                if (typeof total === 'number') initialTotalKnown = total
                if (typeof returned === 'number') initialReturned = returned
            } catch {
                /* not JSON or already consumed; ignore */
            }
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // Bail gracefully if the upstream API is unreachable.
        const firstCard = page.locator('[result-id]').first()
        try {
            await firstCard.waitFor({ state: 'visible', timeout: SHORT_RESULT_WAIT_MS })
        } catch {
            test.skip(true, 'Upstream Atlas API not returning results in this environment')
        }

        // Give the response listener a tick to read the JSON body.
        await page.waitForTimeout(1_000)
        if (
            initialTotalKnown != null &&
            initialReturned != null &&
            initialTotalKnown <= initialReturned
        ) {
            test.skip(
                true,
                `Initial /_search returned all ${initialTotalKnown} hits — no second page to fetch.`,
            )
        }

        const initialCount = searchRequestCount
        // Scroll the results-grid container far enough to cross the
        // load-more threshold. Masonic listens on the document /
        // virtual scroller — flinging mouseWheel covers both. We
        // hover over the results grid first so the wheel events are
        // dispatched into the right element.
        const grid = page.locator('[result-id]').first()
        await grid.hover()
        for (let i = 0; i < 20; i++) {
            await page.mouse.wheel(0, 4000)
            await page.waitForTimeout(200)
        }

        // Allow the follow-up request to fire.
        await page.waitForTimeout(3_000)

        // PIT-style pagination fires at least one additional search
        // request beyond the initial one.
        expect(searchRequestCount).toBeGreaterThan(initialCount)
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
