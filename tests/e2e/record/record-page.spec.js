import { test, expect } from '@playwright/test'
import { navigateToRecord, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

test.describe('Record Page', () => {
    test('record page loads at /record without a URI parameter', async ({ page }) => {
        const errors = []
        page.on('pageerror', (err) => errors.push(err.message))

        await navigateToRecord(page)

        // The page should not crash even without a URI param
        const body = page.locator('body')
        await expect(body).toBeVisible()

        const critical = filterCriticalJsErrors(errors)
        expect(critical).toEqual([])
    })

    test('page title contains "Atlas"', async ({ page }) => {
        await navigateToRecord(page)
        const title = await page.title()
        expect(title.toLowerCase()).toContain('atlas')
    })

    test('content area is present', async ({ page }) => {
        await navigateToRecord(page)
        const hasContent = await page.evaluate(() => document.body.innerHTML.length > 200)
        expect(hasContent).toBeTruthy()
    })

    test('record page with a URI param does not crash', async ({ page }) => {
        const errors = []
        page.on('pageerror', (err) => errors.push(err.message))

        await navigateToRecord(page, 'urn:nasa:pds:nonexistent_test_record')

        const body = page.locator('body')
        await expect(body).toBeVisible()

        const critical = filterCriticalJsErrors(errors)
        expect(critical).toEqual([])
    })
})
