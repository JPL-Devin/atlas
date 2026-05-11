import { test, expect } from '@playwright/test'
import { filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Page-load performance tests for Atlas.
 *
 * We measure time-to-interactive on the Search route, navigation timing,
 * JS error count during boot, and (where supported) JS heap size.
 */

const SEARCH_URL = '/search'

test.describe('Page Load Performance', () => {
    test('/search loads within 15 seconds', async ({ page }) => {
        const start = Date.now()
        await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
        const elapsed = Date.now() - start

        // Generous threshold for CI runners that may be slow
        expect(elapsed).toBeLessThan(15000)
    })

    test('navigation timing metrics are reasonable', async ({ page }) => {
        await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const navTiming = await page.evaluate(() => {
            const entries = performance.getEntriesByType('navigation')
            if (entries.length === 0) return null
            const nav = entries[0]
            return {
                domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
                loadComplete: nav.loadEventEnd - nav.startTime,
                domInteractive: nav.domInteractive - nav.startTime,
            }
        })

        if (navTiming) {
            expect(navTiming.domContentLoaded).toBeLessThan(15000)
            expect(navTiming.domInteractive).toBeGreaterThan(0)
        }
    })

    test('no critical JavaScript errors during initial load', async ({ page }) => {
        const errors = []
        page.on('pageerror', (err) => errors.push(err.message))

        await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const critical = filterCriticalJsErrors(errors)
        expect(critical).toEqual([])
    })

    test('memory usage stays within 512MB threshold', async ({ page }) => {
        await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

        const memory = await page.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                }
            }
            return null
        })

        if (!memory) {
            test.skip(true, 'SKIP: performance.memory not available in this browser')
            return
        }

        const MB = 1024 * 1024
        expect(memory.usedJSHeapSize).toBeLessThan(512 * MB)
    })
})
