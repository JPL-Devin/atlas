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

    test('Topbar shows the Archive Explorer page name', async ({ page }) => {
        await navigateToArchiveExplorer(page)
        // The Topbar h2 reflects the active route's display name. The
        // exact phrasing may evolve, so accept either "Archive Explorer"
        // or "Files" / "FileX" / common variants.
        const h2Text = await page.locator('h2').first().textContent().catch(() => '')
        expect((h2Text || '').toLowerCase()).toMatch(/archive|file|explorer/)
    })

    test('Toolbar navigation hamburger remains visible on archive-explorer', async ({ page }) => {
        await navigateToArchiveExplorer(page)
        await expect(page.getByRole('button', { name: 'navigation' })).toBeVisible()
    })
})
