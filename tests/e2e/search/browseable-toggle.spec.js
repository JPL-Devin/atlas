import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Results heading "All Products" / "Browseable Images" toggle.
 *
 * The toggle is a MUI ToggleButtonGroup (`aria-label="product type"`)
 * rendered immediately left of the ResultsSorter SplitButton. When
 * "Browseable Images" is selected (the default) the outgoing `_search`
 * body gains a `terms` clause on `archive.file_extension`; "All Products"
 * drops it.
 */

const EXTENSION_FIELD = 'archive.file_extension'

const emptyHits = { hits: { total: { value: 0 }, hits: [] } }

const findExtensionTerms = (body) => {
    const must = body?.query?.bool?.must
    if (!Array.isArray(must)) {
        return null
    }
    const clause = must.find((m) => m?.terms?.[EXTENSION_FIELD] != null)
    return clause ? clause.terms[EXTENSION_FIELD] : null
}

test.describe('Search - browseable images toggle', () => {
    test('the toggle sits left of Sort and defaults to Browseable Images', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const toggle = page.getByRole('group', { name: 'product type' })
        await expect(toggle).toBeVisible({ timeout: 20_000 })

        const allBtn = toggle.getByRole('button', { name: 'all products' })
        const browseableBtn = toggle.getByRole('button', { name: 'browseable images' })
        await expect(allBtn).toBeVisible()
        await expect(browseableBtn).toBeVisible()
        await expect(browseableBtn).toHaveAttribute('aria-pressed', 'true')
        await expect(allBtn).toHaveAttribute('aria-pressed', 'false')

        const sortGroup = page.getByRole('group', { name: 'split button' }).first()
        await expect(sortGroup).toBeVisible({ timeout: 20_000 })
        const toggleBox = await toggle.boundingBox()
        const sortBox = await sortGroup.boundingBox()
        expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(sortBox.x + 1)

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('Browseable Images constrains file extensions; All Products does not', async ({
        page,
    }) => {
        const bodies = []

        await page.route(/_search/, async (route) => {
            const body = route.request().postDataJSON()
            if (body?.query) {
                bodies.push(body)
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(emptyHits),
            })
        })

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await expect.poll(() => bodies.length, { timeout: 20_000 }).toBeGreaterThan(0)
        const defaultTerms = findExtensionTerms(bodies[bodies.length - 1])
        expect(defaultTerms).not.toBeNull()
        expect(defaultTerms).toEqual(expect.arrayContaining(['img', 'png', 'jpg', 'obj']))

        const toggle = page.getByRole('group', { name: 'product type' })
        await expect(toggle).toBeVisible({ timeout: 20_000 })

        const before = bodies.length
        await toggle.getByRole('button', { name: 'all products' }).click()
        await expect.poll(() => bodies.length, { timeout: 20_000 }).toBeGreaterThan(before)
        expect(findExtensionTerms(bodies[bodies.length - 1])).toBeNull()
        await expect(toggle.getByRole('button', { name: 'all products' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )

        const afterAll = bodies.length
        await toggle.getByRole('button', { name: 'browseable images' }).click()
        await expect.poll(() => bodies.length, { timeout: 20_000 }).toBeGreaterThan(afterAll)
        expect(findExtensionTerms(bodies[bodies.length - 1])).not.toBeNull()
    })
})
