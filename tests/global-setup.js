/**
 * Playwright global setup — runs once before all test suites.
 *
 * Atlas has no database, so this file only ensures the production build
 * exists. The actual server start is handled by `webServer` in
 * playwright.config.js.
 *
 * The build is invoked with PUBLIC_URL stripped from the loaded `.env`
 * files so webpack's `publicPath` resolves to "/". This matches what the
 * test webServer config expects (it runs the Express server with runtime
 * `PUBLIC_URL=''`).
 *
 * Why this is non-trivial: `config/env.js` loads `.env*` via
 * `dotenv-expand`, and `dotenv-expand@12` treats an empty-string env var
 * as unset and re-expands the value from the file. So passing
 * `PUBLIC_URL=''` to the child process is NOT enough — dotenv-expand will
 * still pick up `PUBLIC_URL=/beta` from `.env`. To keep PUBLIC_URL out of
 * the build environment, we temporarily rewrite `.env` without that line
 * and restore it after the build.
 */

import { existsSync, readFileSync, writeFileSync, copyFileSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

function buildAppWithEmptyPublicUrl(cwd) {
    const envPath = resolve(cwd, '.env')
    const backupPath = resolve(cwd, '.env.playwright-bak')

    let envBackedUp = false
    try {
        if (existsSync(envPath)) {
            // Back up the original .env so we can restore it even if the
            // build crashes
            copyFileSync(envPath, backupPath)
            envBackedUp = true

            // Write a sanitized .env that omits any PUBLIC_URL definition.
            // Comment out (rather than delete) to make the rewrite obvious
            // if anything fails before restore.
            const original = readFileSync(envPath, 'utf8')
            const sanitized = original
                .split(/\r?\n/)
                .map((line) =>
                    /^\s*PUBLIC_URL\s*=/.test(line) ? `# ${line} # stripped by tests/global-setup.js` : line,
                )
                .join('\n')
            writeFileSync(envPath, sanitized, 'utf8')
        }

        execSync('npm run build', {
            stdio: 'inherit',
            cwd,
            env: { ...process.env, PUBLIC_URL: '' },
        })
    } finally {
        if (envBackedUp && existsSync(backupPath)) {
            copyFileSync(backupPath, envPath)
            unlinkSync(backupPath)
        }
    }
}

export default async function globalSetup() {
    const cwd = process.cwd()
    const buildDir = resolve(cwd, 'build/atlas')

    if (!existsSync(buildDir)) {
        console.log('[global-setup] Build not found, running npm run build...')
        buildAppWithEmptyPublicUrl(cwd)
    }
    console.log('[global-setup] Build ready.')
}
