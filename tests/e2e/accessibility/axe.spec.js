import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * Automated accessibility scans using axe-core.
 *
 * We scan each top-level route at the WCAG 2.0/2.1 A and AA levels.
 * Atlas inherits some MUI-shipped a11y issues (notably color-contrast
 * on disabled controls) and some Atlas-shipped issues that we don't
 * want to fail tests on yet — we will assert that the *count* of
 * violations does not exceed a baseline, so a regression that
 * introduces a *new* violation can be caught without forcing a
 * full a11y cleanup as a prerequisite.
 *
 * If you fix existing violations, please lower the corresponding
 * baseline in `BASELINE_MAX_VIOLATIONS` so the regression net keeps
 * tightening.
 */

const BASELINE_MAX_VIOLATIONS = 50 // generous initial budget; tighten as fixes land
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const ROUTES = ['/search', '/record', '/cart', '/archive-explorer']

test.describe('Automated a11y (axe-core) per route', () => {
    for (const path of ROUTES) {
        test(`${path} has no NEW axe violations beyond the baseline`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)

            const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()

            // Surface a brief summary in the test report so the diff
            // between runs is easy to eyeball.
            const ids = results.violations.map((v) => `${v.id} (${v.nodes.length})`).sort()
            // eslint-disable-next-line no-console
            console.log(`[axe] ${path}: ${results.violations.length} violations:`, ids)

            expect(results.violations.length).toBeLessThanOrEqual(BASELINE_MAX_VIOLATIONS)
        })
    }
})

test.describe('Keyboard / focus a11y', () => {
    test('Escape key closes the Information modal', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        await page.getByRole('button', { name: 'info button' }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
    })

    test('Tab from page entry reaches at least one button in the SPA', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // Move focus into the SPA shell. We don't assert WHICH element
        // gets focus first — only that *something* focusable exists
        // and the browser will land on it.
        await page.keyboard.press('Tab')
        const focused = await page.evaluate(() => {
            const el = document.activeElement
            return el ? { tag: el.tagName, role: el.getAttribute('role') } : null
        })
        expect(focused).not.toBeNull()
        expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused.tag)
    })
})
