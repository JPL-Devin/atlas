import { test, expect } from '@playwright/test'
import { waitForAppReady, filterCriticalJsErrors } from '../../helpers/atlas-helpers.js'

/**
 * SecondaryPanel — Leaflet map.
 *
 * /search shows a Leaflet/CartoCosmos-driven map between the
 * FiltersPanel and the ResultsPanel. Until this spec, the map's
 * presence was implicitly assumed by the per-route smoke tests but
 * never asserted directly. Two regression surfaces:
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
    test('toggling the Map Panel mounts a Leaflet container', async ({ page }) => {
        const errors = []
        page.on('pageerror', (e) => errors.push(e.message))

        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await waitForAppReady(page)

        // The secondary (map) panel is off by default — see
        // `src/core/redux/store/initial.js` `workspace.main.secondary`.
        // The Toolbar exposes an aria-label="Map Panel" toggle button.
        const mapToggle = page.getByRole('button', { name: 'Map Panel', exact: true })
        await expect(mapToggle).toBeVisible({ timeout: 20_000 })
        await mapToggle.click()

        // Heading reads "Map" (per SecondaryPanel.js heading.title)
        // once the panel is mounted.
        await expect(page.getByText('Map', { exact: true })).toBeVisible({
            timeout: 20_000,
        })

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
})
