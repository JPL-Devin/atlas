import { test, expect } from '@playwright/test'
import { navigateToSearch, waitForAppReady } from '../../helpers/atlas-helpers.js'

/**
 * Helper: use addInitScript to intercept the server-injected
 * window.APP_CONFIG assignment and inject a BANNER_MESSAGE before
 * React boots.
 */
async function injectBannerMessage(page, bannerText) {
    await page.addInitScript((msg) => {
        let _config = null
        Object.defineProperty(window, 'APP_CONFIG', {
            get() {
                return _config
            },
            set(val) {
                if (val && typeof val === 'object') {
                    val.BANNER_MESSAGE = msg
                }
                _config = val
            },
            configurable: true,
            enumerable: true,
        })
    }, bannerText)
}

test.describe('MessageBanner', () => {
    test('does not render when BANNER_MESSAGE is empty', async ({ page }) => {
        await navigateToSearch(page)
        const banner = page.getByTestId('message-banner')
        await expect(banner).toHaveCount(0)
    })

    test('banner is not visible on any route by default', async ({ page }) => {
        for (const route of ['/search', '/record', '/cart', '/archive-explorer']) {
            await page.goto(route, { waitUntil: 'domcontentloaded' })
            await waitForAppReady(page)
            await expect(page.getByTestId('message-banner')).toHaveCount(0)
        }
    })

    test('renders the banner when BANNER_MESSAGE is set via APP_CONFIG', async ({ page }) => {
        const bannerText = 'Scheduled maintenance tonight.'
        await injectBannerMessage(page, bannerText)

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const banner = page.getByTestId('message-banner')
        await expect(banner).toBeVisible()
        await expect(banner).toContainText(bannerText)
    })

    test('banner has correct styling when rendered', async ({ page }) => {
        const bannerText = 'Test styling check'
        await injectBannerMessage(page, bannerText)

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const banner = page.getByTestId('message-banner')
        await expect(banner).toBeVisible()

        const styles = await banner.evaluate((el) => {
            const cs = window.getComputedStyle(el)
            return {
                color: cs.color,
                textAlign: cs.textAlign,
                backgroundImage: cs.backgroundImage,
            }
        })
        // #700000 = rgb(112, 0, 0)
        expect(styles.color).toBe('rgb(112, 0, 0)')
        expect(styles.textAlign).toBe('center')
        expect(styles.backgroundImage).toContain('linear-gradient')
    })
})
