import { test, expect } from '@playwright/test'
import { navigateToCart, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

test.describe('Cart Page', () => {
    test('cart page loads at /cart', async ({ page }) => {
        await navigateToCart(page)
        const url = page.url()
        expect(url).toContain('/cart')
    })

    test('page title contains "Atlas"', async ({ page }) => {
        await navigateToCart(page)
        const title = await page.title()
        expect(title.toLowerCase()).toContain('atlas')
    })

    test('empty cart state renders without crashing', async ({ page }) => {
        const errors = []
        page.on('pageerror', (err) => errors.push(err.message))

        await navigateToCart(page)

        const body = page.locator('body')
        await expect(body).toBeVisible()

        // Body should have rendered something
        const hasContent = await page.evaluate(() => document.body.innerHTML.length > 200)
        expect(hasContent).toBeTruthy()

        const critical = filterCriticalJsErrors(errors)
        expect(critical).toEqual([])
    })
})
