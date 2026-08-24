import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * SecondaryPanel — Leaflet map.
 *
 * The map is a results view: Grid / List / Table / Map tabs in the
 * ResultsPanel, plus a Split toggle that shows the map beside the
 * active view. Two regression surfaces:
 *
 *   1. The Leaflet container fails to mount (e.g. Leaflet's CSS or
 *      JS regresses, or the SecondaryPanel's `width === 0` guard
 *      changes and the map never receives a size).
 *   2. The map throws on bootstrap and silently corrupts other state.
 *
 * `.leaflet-container` is the canonical class Leaflet sets on its
 * root container. It's not a hashed JSS class — Leaflet sets it
 * itself in `leaflet.css`, so it's stable across builds.
 *
 * The CartoCosmos `<App>` component (src/CartoCosmos/components/
 * container/App.jsx) starts with `targetPlanet = 'None'` and only
 * mounts the Leaflet `<MapContainer>` once a target body is picked
 * (either via the dropdown or auto-picked from `activeMissions`).
 * In the test environment, `activeMissions` may not auto-select a
 * body in time, so the test explicitly picks Mars from the
 * `TargetDropdown` MUI `<Select>` to deterministically force the
 * Leaflet mount.
 */

test.describe('Search - secondary (map) panel', () => {
    test('the Map results view mounts a Leaflet container', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // Map is the fourth results view tab, off by default.
        const mapTab = page.getByRole('tab', { name: 'Map', exact: true })
        await expect(mapTab).toBeVisible({ timeout: 20_000 })
        await mapTab.click()

        // The TargetDropdown <Select> is the only MUI Select on the
        // /search page that accepts planet/moon names. If no target
        // is picked yet, the CartoCosmos shell shows "Select a target
        // body to get started" and Leaflet never mounts. Explicitly
        // pick Mars so the test doesn't depend on activeMissions
        // auto-selecting.
        const targetSelect = page.locator('.MuiSelect-select').first()
        await expect(targetSelect).toBeVisible({ timeout: 20_000 })
        await targetSelect.click()

        // The dropdown listbox is rendered in a portal. Pick "Mars"
        // (a well-supported PDS body that's always non-disabled).
        await page.getByRole('option', { name: 'Mars', exact: true }).click()

        // Leaflet writes `.leaflet-container` on its root <div>.
        await expect(page.locator('.leaflet-container').first()).toBeVisible({
            timeout: 20_000,
        })

        // Leaflet panes are present too — confirms Leaflet bootstrapped
        // beyond just the container element.
        await expect(page.locator('.leaflet-map-pane').first()).toBeAttached({
            timeout: 20_000,
        })

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })

    test('the Split toggle shows the map beside the active view', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        const split = page.getByRole('button', { name: 'split map', exact: true })
        await expect(split).toBeVisible({ timeout: 20_000 })
        await expect(split).toHaveAttribute('aria-pressed', 'false')
        await split.click()
        await expect(split).toHaveAttribute('aria-pressed', 'true')

        // Grid is still the selected view while the map shares the row.
        await expect(page.getByRole('tab', { name: 'Grid', exact: true })).toHaveAttribute(
            'aria-selected',
            'true'
        )

        expect(filterCriticalJsErrors(errors)).toEqual([])
    })
})
