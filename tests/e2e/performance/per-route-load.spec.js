import { test, expect } from '@playwright/test'
import { filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Per-route page-load performance.
 *
 * `page-load.spec.js` only benchmarks `/search`. The other three
 * top-level routes can regress independently — `/record` in particular
 * boots OpenSeadragon, which is heavier than the rest. This spec adds
 * a load-time budget and a critical-error check for each route.
 *
 * What we measure: time until the SPA shell is interactive (the
 * Topbar's "navigation" button has appeared). This is the right
 * user-perceived load metric for a client-rendered SPA and is
 * independent of upstream API latency.
 *
 * What we do NOT include in the budget: time waiting for the search
 * proxy / archive data service to respond. Those services are
 * separate from Atlas (see AGENTS.md), can be arbitrarily slow on
 * any given network, and would otherwise produce flaky perf
 * failures that don't reflect the SPA's actual load performance.
 * We still wait for `networkidle` after the budget assertion so
 * lingering errors can fire, but its duration is not asserted.
 */

const PER_ROUTE_LOAD_BUDGET_MS = 15_000

const ROUTES = ['/search', '/record', '/cart', '/archive-explorer']

test.describe('Per-route page-load performance', () => {
    for (const path of ROUTES) {
        test(`${path} SPA shell becomes interactive within ${PER_ROUTE_LOAD_BUDGET_MS / 1000}s without critical errors`, async ({
            page,
        }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))

            const start = Date.now()
            await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 })
            // The Topbar's navigation button is the first interactive
            // element React commits to the DOM on every route. Waiting
            // for it gives us a true "time-to-interactive" reading and
            // is independent of the upstream search/archive APIs.
            await page
                .getByRole('button', { name: 'navigation' })
                .waitFor({ state: 'visible', timeout: PER_ROUTE_LOAD_BUDGET_MS })
            const elapsed = Date.now() - start

            expect(elapsed).toBeLessThan(PER_ROUTE_LOAD_BUDGET_MS)

            // Let the page fully settle so downstream errors (if any)
            // can fire before we filter and assert. Duration of this
            // wait is NOT part of the load budget.
            await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
            expect(filterCriticalJsErrors(errors)).toEqual([])
        })
    }
})
