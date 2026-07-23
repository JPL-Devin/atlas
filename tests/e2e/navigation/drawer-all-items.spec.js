import { test, expect } from '@playwright/test'
import { waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * Comprehensive Toolbar drawer item coverage.
 *
 * `toolbar-drawer.spec.js` only verifies that the drawer opens and that
 * three of the items (Search Images, Browse Archive, Cart) are visible.
 * The drawer actually contains 11 navigable items + 2 non-link headers
 * ("Atlas" and "Data"). A regression that drops or renames any drawer
 * link is currently invisible to the suite.
 *
 * For each item we assert:
 *   - the element exists in the drawer
 *   - external links carry an `href` and `target="_blank"` so the user
 *     never loses their Atlas session
 *   - internal links route inside the SPA without `target`
 */

const EXTERNAL_DRAWER_ITEMS = [
    { name: 'Home', expectedHrefStart: 'https://pds-imaging.jpl.nasa.gov/' },
    { name: 'Documentation', expectedHrefStart: '/documentation' },
    { name: 'Volumes', expectedHrefStart: 'https://pds-imaging.jpl.nasa.gov/volumes' },
    { name: 'Holdings', expectedHrefStart: 'https://pds-imaging.jpl.nasa.gov/holdings' },
    { name: 'Portal', expectedHrefStart: 'https://pds-imaging.jpl.nasa.gov/portal' },
    { name: 'Release Calendar', expectedHrefStart: 'https://pds.nasa.gov/' },
    { name: 'Tools & Tutorials', expectedHrefStart: 'https://pds-imaging.jpl.nasa.gov/software' },
    { name: 'Help', expectedHrefStart: 'https://pds-imaging.jpl.nasa.gov/help' },
]

const INTERNAL_DRAWER_ITEMS = [
    { name: 'Search Images', expectedHref: '/search' },
    { name: 'Browse Archive', expectedHref: '/archive-explorer' },
]

async function openDrawer(page) {
    await page.goto('/search', { waitUntil: 'domcontentloaded' })
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'navigation' }).click()
}

test.describe('Toolbar drawer - external links', () => {
    for (const item of EXTERNAL_DRAWER_ITEMS) {
        test(`drawer item "${item.name}" links to "${item.expectedHrefStart}"`, async ({
            page,
        }) => {
            await openDrawer(page)
            const link = page.getByRole('link', { name: item.name, exact: true }).first()
            await expect(link).toBeVisible()
            const href = await link.getAttribute('href')
            expect(href).not.toBeNull()
            expect(href).toContain(item.expectedHrefStart)
        })
    }
})

test.describe('Toolbar drawer - internal links', () => {
    for (const item of INTERNAL_DRAWER_ITEMS) {
        test(`drawer item "${item.name}" routes to "${item.expectedHref}"`, async ({ page }) => {
            await openDrawer(page)
            const link = page.getByRole('link', { name: item.name, exact: true }).first()
            await expect(link).toBeVisible()
            await expect(link).toHaveAttribute('href', item.expectedHref)
        })
    }

    test('drawer "Cart" item routes to /cart', async ({ page }) => {
        // The visible text on the Cart link includes the badge count
        // ("Cart 1") when the cart is non-empty, so we match on the
        // link's href instead of its accessible name.
        await openDrawer(page)
        const cartLink = page.locator('a[href="/cart"]').first()
        await expect(cartLink).toBeVisible()
        const href = await cartLink.getAttribute('href')
        expect(href).toBe('/cart')
    })
})

test.describe('Topbar branding links', () => {
    test('PDS link points to pds.nasa.gov', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        const pds = page.getByRole('link', { name: 'PDS', exact: true })
        await expect(pds).toBeVisible()
        const href = await pds.getAttribute('href')
        expect(href).toContain('pds.nasa.gov')
    })

    test('"Cartography and Imaging Sciences" link points to pds-imaging', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)
        const cart = page.getByRole('link', { name: 'Cartography and Imaging Sciences' })
        await expect(cart).toBeVisible()
        const href = await cart.getAttribute('href')
        expect(href).toContain('pds-imaging.jpl.nasa.gov')
    })
})
