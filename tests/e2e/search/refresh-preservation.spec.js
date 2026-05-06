import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Refresh-mid-flow tests.
 *
 * Atlas has two URL-driven views:
 *
 *   - `/search?<query-string>` — filter state is round-tripped via
 *     query params (covered structurally in url-state.spec.js).
 *   - `/record?uri=<lidvid>` — the entire record view is keyed off
 *     the `uri` query parameter.
 *
 * A hard browser refresh on either of those URLs should restore the
 * same view. This used to silently break when local-only state crept
 * into the components, so this spec hardens against that regression.
 */

test.describe('Refresh preservation', () => {
    test('hard refresh on /search preserves the URL the SPA settled on', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // The SPA reflects filter state into the URL via query
        // params, but the exact serialization depends on what the
        // upstream API returns. Rather than asserting that a specific
        // param survives end-to-end (which depends on live API
        // behavior and is flaky), capture whatever URL the SPA
        // settles on after the initial load and verify that a hard
        // reload preserves it.
        await page.goto('/search?_text=mars', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        const settledURL = page.url()
        expect(settledURL).toContain('/search')

        await page.reload({ waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        expect(page.url()).toBe(settledURL)
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('hard refresh on /record?uri=<malformed> preserves the uri parameter', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // We intentionally use a clearly-fake uri so the test is hermetic
        // (no live API dependency on a particular record existing). The
        // assertion is purely about URL and shell behavior.
        const uri = encodeURIComponent('urn:nasa:pds:test:never_exists::1.0')
        await page.goto(`/record?uri=${uri}`, { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        expect(page.url()).toContain(`uri=${uri}`)

        await page.reload({ waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        expect(page.url()).toContain(`uri=${uri}`)
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('hard refresh on /archive-explorer preserves any ?mission= param', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        // The Archive Explorer reflects column-drilling in the URL via
        // ?mission=... — even when the mission doesn't exist, refreshing
        // shouldn't strip the param.
        await page.goto('/archive-explorer?mission=Imaginary%20Mission', {
            waitUntil: 'domcontentloaded',
        })
        await waitForAppReady(page)
        expect(page.url()).toContain('mission=Imaginary')

        await page.reload({ waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        expect(page.url()).toContain('mission=Imaginary')
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
