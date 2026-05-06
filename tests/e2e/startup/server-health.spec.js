import { test, expect } from '@playwright/test'

/**
 * Server startup / static endpoint sanity checks.
 *
 * These tests do not exercise the React SPA — they only verify that the
 * production Express server is up and exposing its baseline endpoints.
 */

test.describe('Atlas Server Startup', () => {
    test('/_health returns 200 with healthy status and version info', async ({ request }) => {
        const res = await request.get('/_health')
        expect(res.status()).toBe(200)
        const body = await res.json()
        expect(body.status).toBe('healthy')
        expect(body.message).toBeTruthy()
        expect(body.version).toBeDefined()
        expect(body.version.atlas).toBeTruthy()
    })

    test('/robots.txt returns the expected content', async ({ request }) => {
        const res = await request.get('/robots.txt')
        expect(res.status()).toBe(200)
        const text = await res.text()
        expect(text).toContain('User-agent: *')
        expect(text).toContain('Allow: /')
    })

    test('root / redirects to /search with 307', async ({ request }) => {
        const res = await request.get('/', { maxRedirects: 0 })
        expect(res.status()).toBe(307)
        const location = res.headers()['location']
        expect(location).toContain('/search')
    })

    test('no critical errors during startup', async ({ request }) => {
        const res = await request.get('/_health')
        expect(res.status()).toBe(200)
    })
})
