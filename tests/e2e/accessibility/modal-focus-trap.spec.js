import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * Modal focus trap.
 *
 * `basic-a11y.spec.js` covers Escape closing a modal but doesn't
 * verify Tab cycling stays *within* the modal. A11y best practice
 * (WCAG 2.4.3 Focus Order, ARIA Authoring Practices for Dialog) is
 * that focus must be trapped inside an open modal — Tabbing past
 * the last focusable should wrap to the first, and Shift+Tab from
 * the first should wrap to the last.
 *
 * MUI's Dialog uses FocusTrap by default, but custom Dialog wrappers
 * sometimes break it. This test:
 *
 *   1. Opens the AddFilter modal.
 *   2. Tabs through 30 focusable elements.
 *   3. Asserts focus never leaves the dialog.
 */

test.describe('Accessibility - modal focus trap', () => {
    test('Tab cycles focus within the AddFilter modal and never escapes to page chrome', async ({
        page,
    }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // Open the AddFilter dialog.
        await page.getByRole('button', { name: 'add filter' }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible({ timeout: 10_000 })

        // Cycle focus 30 times and verify the active element is
        // always *inside* the dialog. We use a generous loop so a
        // long Tab order doesn't escape detection.
        for (let i = 0; i < 30; i++) {
            await page.keyboard.press('Tab')
            const isInsideDialog = await page.evaluate(() => {
                const dialog = document.querySelector('[role="dialog"]')
                if (!dialog) return false
                return dialog.contains(document.activeElement)
            })
            expect(isInsideDialog, `focus escaped on Tab #${i + 1}`).toBe(true)
        }

        // Shift+Tab should also stay in.
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Shift+Tab')
            const isInsideDialog = await page.evaluate(() => {
                const dialog = document.querySelector('[role="dialog"]')
                if (!dialog) return false
                return dialog.contains(document.activeElement)
            })
            expect(isInsideDialog, `focus escaped on Shift+Tab #${i + 1}`).toBe(true)
        }

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
