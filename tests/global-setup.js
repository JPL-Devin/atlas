/**
 * Playwright global setup — runs once before all test suites.
 *
 * Atlas has no database, so this file only ensures the production build
 * exists. The actual server start is handled by `webServer` in
 * playwright.config.js.
 *
 * The build is invoked with PUBLIC_URL='' so static assets are produced at
 * the root path (matching what the test webServer config expects).
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

export default async function globalSetup() {
    const buildDir = resolve(process.cwd(), 'build/atlas')

    if (!existsSync(buildDir)) {
        // eslint-disable-next-line no-console
        console.log('[global-setup] Build not found, running npm run build...')
        execSync('npm run build', {
            stdio: 'inherit',
            cwd: process.cwd(),
            // Force PUBLIC_URL='' so the build serves from / (matching the
            // webServer env in playwright.config.js). dotenv.config() in the
            // build script will not override env vars that are already set.
            env: { ...process.env, PUBLIC_URL: '' },
        })
    }
    // eslint-disable-next-line no-console
    console.log('[global-setup] Build ready.')
}
