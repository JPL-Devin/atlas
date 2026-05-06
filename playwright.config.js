import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Atlas
 * @see https://playwright.dev/docs/test-configuration
 *
 * Atlas has no database, so the Playwright `webServer` option manages the
 * server lifecycle. globalSetup is responsible only for ensuring the build
 * exists before the server tries to serve it.
 */
export default defineConfig({
    globalSetup: './tests/global-setup.js',

    testDir: './tests',
    testMatch: '**/*.spec.js',

    // 2 minutes per test — Atlas has no DB setup so it's faster than MMGIS
    timeout: 120 * 1000,

    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'playwright-report/results.json' }],
        ['junit', { outputFile: 'playwright-report/results.xml' }],
        ['list'],
    ],

    use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:18500',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: /cross-browser/,
        },
    ],

    // Atlas has no database to initialize, so Playwright's built-in webServer
    // is the simplest way to manage the server lifecycle. We force PUBLIC_URL
    // to '' so the app is served from the root path during tests.
    webServer: {
        command: 'node scripts/start-prod.js',
        port: 18500,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
        env: {
            NODE_ENV: 'production',
            PORT: '18500',
            PUBLIC_URL: '',
            DISABLE_CSP: 'true',
            REACT_APP_DOMAIN:
                process.env.REACT_APP_DOMAIN || 'https://pds-imaging.jpl.nasa.gov/api',
        },
    },
})
