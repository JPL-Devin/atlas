import { test, expect } from '@playwright/test'
import { filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Per-route page-load performance.
 *
 * `page-load.spec.js` only benchmarks `/search`. The other three
 * top-level routes can regress independently — `/record` in particular
 * boots OpenSeadragon, which is heavier than the rest. This spec adds
 * a load-time budget and a critical-error check for each route.
 */

const PER_ROUTE_LOAD_BUDGET_MS = 15_000

const ROUTES = ['/search', '/record', '/cart', '/archive-explorer']

test.describe('Per-route page-load performance', () => {
    for (const path of ROUTES) {
        test(`${path} loads within ${PER_ROUTE_LOAD_BUDGET_MS / 1000}s without critical errors`, async ({
            page,
        }) => {
            const errors = []
            page.on('pageerror', (e) => errors.push(e.message))

            const start = Date.now()
            await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 })
            await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
            const elapsed = Date.now() - start

            expect(elapsed).toBeLessThan(PER_ROUTE_LOAD_BUDGET_MS)
            expect(filterCriticalJsErrors(errors)).toEqual([])
        })
    }
})
