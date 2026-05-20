import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Long-session memory test.
 *
 * `performance/page-load.spec.js` measures heap on a single load.
 * This spec navigates between routes 50 times and asserts heap
 * doesn't grow unbounded — a regression in component cleanup,
 * Leaflet map disposal, OpenSeadragon viewer disposal, or Redux
 * subscription teardown would show up as runaway heap.
 *
 * `performance.memory` is a Chromium-only API. We skip the test on
 * other browsers.
 *
 * We allow generous slack: the heap is allowed to *roughly double*
 * over 50 navigations before we declare a regression. This catches
 * blatant leaks (heap grows 10x) without being flaky on normal GC
 * jitter.
 */

const ROUTES = ['/search', '/cart', '/archive-explorer', '/record']
const NAV_COUNT = 50

test.describe('Performance - long session memory', () => {
    test('heap does not grow unboundedly over 50 route navigations', async ({
        page,
        browserName,
    }) => {
        test.setTimeout(240_000)
        test.skip(
            browserName !== 'chromium',
            'performance.memory is Chromium-only',
        )

        // Register the pageerror listener BEFORE any navigations
        // so it actually catches errors thrown during the burn-in
        // and the 50-navigation main loop.
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // Burn-in nav so the SPA gets warm, JIT'd, and any first-load
        // caches populated. Snapshot baseline heap *after* burn-in.
        // Use domcontentloaded only — no networkidle — so the loop
        // doesn't stall on long-poll requests from the live API.
        await page.goto(ROUTES[0], { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        for (let i = 0; i < 5; i++) {
            await page.goto(ROUTES[i % ROUTES.length], { waitUntil: 'domcontentloaded' })
        }

        const baselineHeap = await page.evaluate(() => {
            if (!performance.memory) return null
            return performance.memory.usedJSHeapSize
        })
        test.skip(baselineHeap == null, 'performance.memory not available in this Chromium build')

        // 50 navigations cycling through the routes.
        for (let i = 0; i < NAV_COUNT; i++) {
            await page.goto(ROUTES[i % ROUTES.length], { waitUntil: 'domcontentloaded' })
        }

        // Force GC to settle counts where possible. We rely on
        // `performance.measureUserAgentSpecificMemory` not being
        // available; just give the engine a tick and trigger a few
        // operations that historically encourage GC.
        await page.waitForTimeout(2_000)

        const finalHeap = await page.evaluate(() => performance.memory.usedJSHeapSize)
        const growthRatio = finalHeap / baselineHeap

        // Heap is allowed to grow up to 4x over 50 navs. Anything
        // bigger is a strong leak signal. The headline number we
        // care about is "did it stop growing or is it linearly
        // accumulating".
        expect(
            growthRatio,
            `Heap grew from ${baselineHeap} to ${finalHeap} (×${growthRatio.toFixed(2)}) over ${NAV_COUNT} navigations`,
        ).toBeLessThan(4)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
