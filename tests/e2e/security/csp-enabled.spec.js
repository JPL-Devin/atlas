import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * SPA bootstraps under a strict Content-Security-Policy.
 *
 * The other security spec (`headers.spec.js`) only verifies that a
 * CSP header is *sent* when DISABLE_CSP is unset. It does not verify
 * that the SPA actually *runs* with CSP enforced — and the test
 * server runs with DISABLE_CSP=true (see playwright.config.js).
 *
 * To approximate a CSP-enforced load without spinning up a parallel
 * server, we intercept the navigation HTML response and inject a
 * strict CSP header. Browser then enforces it for that document and
 * its subresources. If the bundle relies on `eval`, a non-self
 * origin that the directives don't cover, or strips the per-request
 * nonce, we'll see CSP violation reports / a broken SPA.
 *
 * The Pug-rendered `index.pug` already injects per-request nonces
 * into every `<script>` tag (see `scripts/start-prod.js` and
 * `build/atlas/index.pug`). We extract that nonce from the HTML body
 * and rebuild a CSP that allows `'self'` scripts plus that exact
 * nonce — mirroring exactly what the production CSP would do if
 * DISABLE_CSP were false.
 *
 * Note: `style-src 'unsafe-inline'` is kept because @mui/styles
 * uses dynamic `<style>` tags. The production CSP also keeps
 * `'unsafe-inline'` for styles. That's a known constraint, not a
 * test gap.
 */

function buildCsp(nonce) {
    return [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src * data:",
        "font-src 'self' data:",
        "connect-src 'self' *.jpl.nasa.gov *.amazonaws.com *.cloudfront.net",
        "frame-ancestors 'self'",
    ].join('; ')
}

test.describe('Security - SPA bootstraps under enforced CSP', () => {
    test('strict CSP injected into the HTML response does not break the SPA shell', async ({
        page,
    }) => {
        const cspViolations = []
        await page.exposeFunction('__cspViolation', (msg) => cspViolations.push(msg))
        await page.addInitScript(() => {
            // Capture violations at the document level. CSP violations
            // fire `securitypolicyviolation` events on the document.
            document.addEventListener('securitypolicyviolation', (e) => {
                window.__cspViolation(
                    `${e.violatedDirective} | ${e.blockedURI} | ${e.sourceFile}:${e.lineNumber}`,
                )
            })
        })

        // Inject the strict CSP header onto every HTML document
        // response so the browser enforces it. Because the server
        // injects a per-request nonce into every <script> tag, we
        // need to extract that nonce from the HTML body and include
        // it in `script-src` — that's exactly how production handles
        // this when DISABLE_CSP is unset.
        await page.route('**/*', async (route) => {
            const req = route.request()
            const accept = req.headers()['accept'] || ''
            if (req.resourceType() === 'document' && accept.includes('text/html')) {
                const response = await route.fetch()
                const body = await response.text()
                const nonceMatch = body.match(/<script[^>]*nonce="([^"]+)"/)
                const nonce = nonceMatch ? nonceMatch[1] : 'no-nonce-found'
                const headers = response.headers()
                headers['content-security-policy'] = buildCsp(nonce)
                await route.fulfill({
                    status: response.status(),
                    headers,
                    body,
                })
                return
            }
            await route.continue()
        })

        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // SPA shell must still render — Topbar nav button is the
        // canonical "alive" check.
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()

        // Filter out CSP violations from font and image origins —
        // those are external services we can't control from here.
        // What we care about is script-src violations, since those
        // would imply the bundle uses inline scripts or eval.
        const scriptViolations = cspViolations.filter((v) =>
            /script-src/i.test(v),
        )
        expect(scriptViolations).toEqual([])

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
