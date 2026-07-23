import { test, expect } from '@playwright/test'
import { navigateToSearch } from '../../helpers/atlas-helpers.js'

/**
 * Toolbar-drawer (left-rail hamburger) tests.
 *
 * The drawer is implemented as MUI `<Drawer variant="persistent">` and
 * opens when the user clicks the "navigation" IconButton. It contains
 * the section headers (Atlas, Data) and link items including:
 *   Home / Search Images / Browse Archive / Cart / Documentation /
 *   Volumes / Holdings / Portal / Release Calendar / Tools & Tutorials /
 *   Help.
 *
 * See `src/components/Toolbar/Toolbar.js` for the drawerItems array.
 */

test.describe('Toolbar drawer', () => {
    test('clicking "navigation" reveals the drawer items', async ({ page }) => {
        await navigateToSearch(page)

        await page.getByRole('button', { name: 'navigation' }).click()

        // The drawer items render as <a> elements with their name text.
        // Verify the canonical Atlas group is reachable. Use exact match
        // for "Cart" because the Topbar / footer also surface the word.
        await expect(page.getByRole('link', { name: 'Search Images' }).first()).toBeVisible()
        await expect(page.getByRole('link', { name: 'Browse Archive' }).first()).toBeVisible()
        await expect(page.getByRole('link', { name: 'Cart', exact: true })).toBeVisible()
    })

    test('drawer "Cart" link navigates to /cart', async ({ page }) => {
        await navigateToSearch(page)

        await page.getByRole('button', { name: 'navigation' }).click()
        await page.getByRole('link', { name: 'Cart', exact: true }).click()

        await page.waitForURL((u) => u.pathname.includes('/cart'), { timeout: 30000 })
        expect(page.url()).toContain('/cart')
    })

    test('drawer "Browse Archive" link navigates to /archive-explorer', async ({ page }) => {
        await navigateToSearch(page)

        await page.getByRole('button', { name: 'navigation' }).click()
        await page.getByRole('link', { name: 'Browse Archive' }).first().click()

        await page.waitForURL((u) => u.pathname.includes('/archive-explorer'), {
            timeout: 30000,
        })
        expect(page.url()).toContain('/archive-explorer')
    })

    test('drawer "Documentation" link opens in a new tab (target=_blank)', async ({ page }) => {
        await navigateToSearch(page)

        await page.getByRole('button', { name: 'navigation' }).click()
        const docs = page.getByRole('link', { name: 'Documentation' }).first()
        await expect(docs).toBeVisible()

        const target = await docs.getAttribute('target')
        expect(target).toMatch(/_blank/)
    })

    test('drawer external links carry rel="noopener" (security)', async ({ page }) => {
        await navigateToSearch(page)

        await page.getByRole('button', { name: 'navigation' }).click()
        // "Volumes" is a hard-coded external https://pds-imaging.jpl.nasa.gov/...
        const volumes = page.getByRole('link', { name: 'Volumes' })
        await expect(volumes).toBeVisible()
        const rel = await volumes.getAttribute('rel')
        expect(rel || '').toContain('noopener')
    })
})
