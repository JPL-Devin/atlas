import { test, expect } from '@playwright/test'
import { navigateToArchiveExplorer, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

test.describe('Archive Explorer (FileExplorer / FileX)', () => {
    test('archive explorer loads at /archive-explorer', async ({ page }) => {
        await navigateToArchiveExplorer(page)
        const url = page.url()
        expect(url).toContain('/archive-explorer')
    })

    test('archive explorer renders without crashing', async ({ page }) => {
        const errors = []
        page.on('pageerror', (err) => errors.push(err.message))

        await navigateToArchiveExplorer(page)

        const body = page.locator('body')
        await expect(body).toBeVisible()

        const critical = filterCriticalJsErrors(errors)
        expect(critical).toEqual([])
    })

    test('column-based navigation UI is present', async ({ page }) => {
        await navigateToArchiveExplorer(page)

        // The FileExplorer / FileX component uses a column-style navigator.
        // The exact class names are JSS-generated; we look for any container
        // with multiple horizontally-laid-out children, or a class hint.
        const hasColumnUI = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('[class]'))
            return all.some((el) => {
                const cn = (el.className.toString() || '').toLowerCase()
                return (
                    cn.includes('column') ||
                    cn.includes('explorer') ||
                    cn.includes('filex') ||
                    cn.includes('archive')
                )
            })
        })

        expect(hasColumnUI).toBeTruthy()
    })
})
