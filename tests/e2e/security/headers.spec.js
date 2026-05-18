import { test, expect } from '@playwright/test'

/**
 * Security header checks for Atlas.
 *
 * The Express server in scripts/start-prod.js:
 *   - calls app.disable('x-powered-by') (line ~36)
 *   - sets Strict-Transport-Security (HSTS) via helmet.hsts
 *   - sets a Content-Security-Policy unless DISABLE_CSP=true
 *
 * The webServer in playwright.config.js sets DISABLE_CSP=true so CSP-related
 * assertions are conditional.
 */

test.describe('Security Headers', () => {
    test('Strict-Transport-Security (HSTS) header is present', async ({ request }) => {
        const res = await request.get('/_health')
        const headers = res.headers()
        expect(headers['strict-transport-security']).toBeDefined()
        expect(headers['strict-transport-security']).toMatch(/max-age=\d+/)
    })

    test('X-Powered-By header is absent', async ({ request }) => {
        const res = await request.get('/_health')
        const headers = res.headers()
        expect(headers['x-powered-by']).toBeUndefined()
    })

    test('Content-Security-Policy header is configurable via DISABLE_CSP', async ({ request }) => {
        // The Playwright webServer config sets DISABLE_CSP=true for tests so
        // headless browsers can load inline-bundled assets without failing
        // CSP checks. We therefore expect CSP to be ABSENT here, which also
        // verifies that the DISABLE_CSP env var is being honored by the
        // server.
        const res = await request.get('/search')
        expect(res.status()).not.toBe(500)
        const headers = res.headers()
        expect(headers['content-security-policy']).toBeUndefined()
    })

    test('Server header does not leak detailed Express version info', async ({ request }) => {
        const res = await request.get('/_health')
        const headers = res.headers()
        const serverHeader = headers['server'] || ''
        expect(serverHeader).not.toMatch(/express\/\d/i)
    })

    test('healthcheck responds with 200', async ({ request }) => {
        const res = await request.get('/_health')
        expect(res.status()).toBe(200)
    })
})
