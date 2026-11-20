import { test, expect } from '@playwright/test'
import path from 'node:path'

const keyword = { type: 'keyword' }
const mapping = { mappings: { properties: {
    gather: { properties: {
        uri: keyword,
        common: { properties: {
            mission: keyword, spacecraft: keyword, instrument: keyword, target: keyword,
            product_type: keyword, kind: keyword, mission_phase_name: keyword,
        } },
        time: { properties: { start_time: { type: 'date' } } },
        flyby_missions: { properties: { flight_day_number: { type: 'integer' } } },
        landed_missions: { properties: { planet_day_number: { type: 'integer' } } },
        machine_learning: { properties: { classification: { properties: {
            classifications: { properties: { class: keyword, confidence: { type: 'float' } } },
        } } } },
    } },
    archive: { properties: { mission: keyword, bundle_id: keyword } },
} } }

const mockAtlas = async (page) => {
    const requests = []
    await page.route(/\/(?:atlas|raws-test)\/_mapping/, (route) =>
        route.fulfill({ json: { backing_index: mapping } }))
    await page.route(/\/(?:atlas|raws-test)\/_search(?:\?|$)/, (route) => {
        const dsl = route.request().postDataJSON() || {}
        requests.push(dsl)
        const buckets = [{ key: 'mars_2020', doc_count: 4 }, { key: 'cas', doc_count: 3 }]
        const aggs = Object.fromEntries(Object.keys(dsl.aggs || {}).map((key) => [key, { buckets }]))
        return route.fulfill({ json: {
            took: 1, hits: { total: { value: 0, relation: 'eq' }, hits: [] }, aggregations: aggs,
        } })
    })
    return requests
}

const capture = async (page, name) => {
    if (process.env.ATLAS_SCREENSHOT_DIR) {
        await page.screenshot({ path: path.join(process.env.ATLAS_SCREENSHOT_DIR, name + '.png'), animations: 'disabled' })
    }
}

test.use({ viewport: { width: 1440, height: 900 } })

const expectStackedHeader = async (header, mobile = false) => {
    const title = header.getByRole('heading', { name: 'Filters', exact: true })
    const subtitle = header.getByRole('group', { name: 'Filter preset' })
    await expect(subtitle).toBeVisible()
    const titleBox = await title.boundingBox()
    const subtitleBox = await subtitle.boundingBox()
    for (const name of ['reset filters', 'add filter', 'menu', ...(mobile ? ['close filters'] : [])]) {
        const action = header.getByRole('button', { name, exact: true })
        await expect(action).toBeVisible()
        const box = await action.boundingBox()
        expect(Math.abs(box.y + box.height / 2 - titleBox.y - titleBox.height / 2)).toBeLessThan(2)
        if (name === 'close filters') {
            expect(box.width).toBeGreaterThanOrEqual(40)
            expect(box.height).toBeGreaterThanOrEqual(40)
            expect(box.x + box.width).toBeLessThan(titleBox.x)
        }
    }
    expect(subtitleBox.y).toBeGreaterThan(titleBox.y + titleBox.height / 2)
}

test('Atlas homepage repeatedly opens distinct Search and Archive Explorer entries', async ({ page }) => {
    const requests = await mockAtlas(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Featured Missions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Quick Links' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Search Atlas', exact: true })).toHaveAttribute('href', '/search')
    await expect(page.getByRole('link', { name: 'Browse Archive Explorer' })).toHaveAttribute('href', '/archive-explorer')
    await expect(page.getByRole('link', { name: /using the mission image/ })).toHaveCount(6)
    await capture(page, 'atlas-home')

    const home = async () => {
        await page.getByRole('button', { name: 'navigation', exact: true }).click()
        await page.getByRole('link', { name: 'Atlas Home', exact: true }).click()
        await expect(page.getByRole('heading', { name: 'Featured Missions' })).toBeVisible()
    }

    await page.getByRole('link', { name: 'Mars 2020 · Perseverance', exact: true }).click()
    await expect(page).toHaveURL(/_preset=mars-2020.*gather\.common\.mission=mars_2020/)
    await expect(page.getByRole('group', { name: 'Filter preset' })).toBeVisible()
    const presetButton = page.getByRole('button', { name: 'Preset: Mars 2020', exact: true })
    await expect(presetButton).toHaveText('Preset: Mars 2020')
    await expect(page.getByText('Controls shown in Basic Filters.', { exact: true })).toHaveCount(0)
    await capture(page, 'filters-header-unmodified')
    await expect(page.getByRole('button', { name: /quick links/i })).toBeVisible()
    await expect.poll(() => requests.some(({ query }) => JSON.stringify(query || {}).includes('"mars_2020"'))).toBe(true)
    await home()
    await page.getByRole('link', { name: 'Search Cassini using the mission image' }).click()
    await expect(page).toHaveURL(/_preset=planetary-imaging.*gather\.common\.mission=cas/)
    await expect.poll(() => requests.some(({ query }) => JSON.stringify(query || {}).includes('"cas"'))).toBe(true)

    for (const [title, id] of [['Mars 2020 · Perseverance', 'mars_2020'], ['Cassini', 'cas']]) {
        await home()
        await page.getByRole('link', { name: `Archive Explorer ${title}`, exact: true }).click()
        await expect(page).toHaveURL(new RegExp(`/archive-explorer\\?.*mission=${id}`))
        await expect.poll(() => requests.some(({ query }) =>
            JSON.stringify(query || {}).includes('"archive.mission"') &&
            JSON.stringify(query || {}).includes(`"${id}"`))).toBe(true)
    }
})

test('Search presets retain selected criteria, warn on removal, and support Undo and Reset', async ({ page }) => {
    await mockAtlas(page)
    await page.goto('/search?_preset=artemis-ii&gather.common.mission=artemis2&gather.flyby_missions.flight_day_number=4_to_6&gather.common.mission_phase_name=FLYBY')
    await expect(page.getByRole('button', { name: 'remove flight_day_number filter', exact: true })).toBeVisible()
    await expect(page.getByText('In layout', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Kept because it has a value', { exact: true })).toHaveCount(0)
    await expect(page).toHaveURL(/mission_phase_name=FLYBY/)
    await capture(page, 'preset-artemis')
    await capture(page, 'preset-row')
    const header = page.getByRole('group', { name: 'Filter controls' })
    const trigger = header.getByRole('button', { name: 'Preset: Artemis II (modified)' })
    await expectStackedHeader(header)
    await expect(trigger).toHaveText('Preset: Artemis II (modified)')
    await expect(trigger.getByText('Preset:', { exact: true })).toHaveCSS('font-weight', '400')
    await expect(trigger.getByText('Artemis II', { exact: true })).toHaveCSS('font-weight', '700')
    await expect(trigger.getByText('(modified)', { exact: true })).toHaveCSS('font-size', '11px')
    await capture(page, 'filters-header')
    await capture(page, 'filters-header-modified')
    await capture(page, 'header-stacked')
    await capture(page, 'layout-header')
    await trigger.click()
    const picker = page.getByRole('dialog', { name: 'Choose a filter preset' })
    const search = picker.getByRole('searchbox', { name: 'Search presets' })
    await expect(search).toBeFocused()
    await expect(picker.getByText('Labels under each preset describe how it differs from the standard Atlas filters.', { exact: false })).toBeVisible()
    await expect(picker.getByText('Select a different preset, then choose Apply.', { exact: true })).toBeVisible()
    await expect(picker.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled()
    const active = picker.getByRole('button', { name: /^Artemis II/ })
    await expect(active).toHaveAttribute('aria-current', 'true')
    await expect(active.getByRole('img', { name: 'Active preset' })).toBeVisible()
    await expect(active.getByText('Features Flight Day Number', { exact: true })).toBeVisible()
    await expect(active.getByText('Hides Spacecraft', { exact: true })).toBeVisible()
    const mars = picker.getByRole('button', { name: /^Mars 2020/ })
    const preview = picker.getByRole('complementary', { name: 'Filter changes' })
    await expect(preview.getByRole('heading', { name: 'Artemis II' })).toBeVisible()
    await expect(preview.getByText('You’re already using this preset.', { exact: true })).toBeVisible()
    await expect(preview.getByText('Added', { exact: true })).toHaveCount(0)
    await expect(preview.getByText('Removed', { exact: true })).toHaveCount(0)
    await mars.hover()
    await expect(preview.getByRole('heading', { name: 'Mars 2020' })).toBeVisible()
    await expect(preview.getByRole('note')).toContainText('Presets change which filters are shown. Switching keeps your selected values, including Mission.')
    await expect(preview.getByRole('listitem').filter({ hasText: 'Kind' })).toContainText('Added')
    await expect(preview.getByRole('listitem').filter({ hasText: 'Bundle ID' })).toContainText('Added')
    await expect(preview.getByText('Removed', { exact: true })).toHaveCount(0)
    await expect(preview.getByRole('listitem').filter({ hasText: 'Flight Day Number' })).toContainText('Kept because it has a value')
    await expect(preview.getByRole('listitem').filter({ hasText: 'Mission Phase Name' })).toContainText('Kept because it has a value')
    await expect(preview.getByText('Spacecraft', { exact: true })).toHaveCount(0)
    await expect(page).toHaveURL(/_preset=artemis-ii/)
    await capture(page, 'preset-menu')
    await search.press('ArrowDown')
    await expect(preview.getByRole('heading', { name: 'Standard Atlas' })).toBeVisible()
    await search.fill('not a preset')
    await expect(picker.getByRole('status')).toHaveText('No matching presets')
    await search.press('Escape')
    await expect(picker).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(search).toHaveValue('')
    await search.fill('mars 2020')
    await expect(picker.getByRole('button', { name: /^Mars 2020/ })).toBeVisible()
    await search.fill('rover instruments')
    await expect(picker.locator('[data-preset-option]')).toHaveCount(1)
    await search.press('ArrowUp')
    await expect(mars).toBeFocused()
    await mars.press('ArrowDown')
    await expect(mars).toBeFocused()
    await mars.press('Enter')
    await expect(mars).toHaveAttribute('aria-pressed', 'true')
    await picker.getByRole('button', { name: 'Apply and keep filters', exact: true }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page).toHaveURL(/_preset=mars-2020.*mission=artemis2/)
    await expect(page.getByText('Kept because it has a value', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Preset changed to Mars 2020', { exact: true })).toBeVisible()
    await capture(page, 'preset-switched')
    await header.getByRole('button', { name: 'Preset: Mars 2020', exact: true }).click()
    await picker.getByRole('button', { name: /^ML-classified datasets/ }).hover()
    await expect(preview.getByRole('listitem')).toHaveText([
        '=Text SearchUnchanged', '=MissionUnchanged', '=InstrumentUnchanged', '=TargetUnchanged',
        '=Product TypeUnchanged', '−KindRemoved', '↳Mission Phase NameKept because it has a value', '=Start TimeUnchanged',
        '↳Flight Day NumberKept because it has a value', '−Bundle IDRemoved', '+ML ClassAdded', '+ML ConfidenceAdded',
    ])
    await expect(preview.getByText('Kind', { exact: true })).toHaveCSS('text-decoration-line', 'line-through')
    await expect(preview.getByRole('listitem').filter({ hasText: 'Flight Day Number' })).toContainText('Kept because it has a value')
    await capture(page, 'layout-picker')
    await capture(page, 'layout-diff-picker')
    await capture(page, 'preset-naming')
    await search.press('Escape')
    await expect(picker).not.toBeVisible()
    await page.getByRole('button', { name: /remove mission.phase.name filter/i }).click()
    const remove = page.getByRole('dialog', { name: /remove mission phase name/i })
    await expect(remove.getByText(/clears its selected values/)).toBeVisible()
    await remove.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page).toHaveURL(/_preset=artemis-ii/)
    await expect(page).toHaveURL(/mission=artemis2.*flight_day_number=4_to_6/)

    await page.getByRole('button', { name: 'add filter', exact: true }).click()
    const add = page.getByRole('dialog')
    await expect(add.getByText('In this preset', { exact: true })).toBeVisible()
    await expect(add.getByText('Recommended for the Artemis II preset', { exact: true })).toBeVisible()
    await expect(add.getByText('Other filters', { exact: true })).toBeVisible()
    await capture(page, 'preset-add')
    await add.getByRole('checkbox', { name: 'Bundle ID' }).check()
    await add.getByRole('checkbox', { name: 'Mission', exact: true }).uncheck()
    await add.getByRole('button', { name: 'Apply filters' }).click()
    await expect(add.getByText(/will also clear the selected values/)).toBeVisible()
    await add.getByRole('button', { name: 'Apply and clear values' }).click()
    await expect(trigger).toHaveText('Preset: Artemis II (modified)')
    await expect(page).not.toHaveURL(/gather\.common\.mission=/)
    const bundleFilter = page.getByRole('button', { name: 'remove bundle_id filter', exact: true })
    await expect(bundleFilter).toBeVisible()

    const reset = page.getByRole('button', { name: 'reset filters' })
    await reset.hover()
    await expect(page.getByRole('tooltip', { name: 'Restore preset filters and starting values' })).toBeVisible()
    await reset.click()
    await expect(page.getByRole('menuitem', { name: /reset to|clear preset/i })).toHaveCount(0)
    await expect(page).toHaveURL(/_preset=artemis-ii.*mission=artemis2/)
    await expect(bundleFilter).toHaveCount(0)
    await expect(page.getByText('Restored preset filters and starting values for Artemis II')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear preset', exact: true })).toHaveCount(0)
    await trigger.click()
    const all = picker.getByRole('button', { name: /^Standard Atlas/ })
    await all.click()
    await picker.getByRole('button', { name: 'Apply and keep filters', exact: true }).click()
    await expect(page).not.toHaveURL(/_preset=/)
    await expect(page).toHaveURL(/mission=artemis2/)
    await expect(page.getByText('Preset changed to Standard Atlas', { exact: true })).toBeVisible()
    await expect(bundleFilter).toBeVisible()
    await reset.hover()
    await expect(page.getByRole('tooltip', { name: 'Restore standard Atlas filters and default values' })).toBeVisible()
    await header.getByRole('button', { name: 'Preset: Standard Atlas' }).click()
    await expect(all).toHaveAttribute('aria-current', 'true')
})

test('Atlas preset picker stays usable on a narrow screen without the side preview', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await mockAtlas(page)
    await page.goto('/search?_preset=artemis-ii&gather.common.mission=artemis2&gather.common.mission_phase_name=FLYBY')
    await page.getByRole('button', { name: 'filters view', exact: true }).click()
    const header = page.getByRole('group', { name: 'Filter controls' })
    const trigger = header.getByRole('button', { name: 'Preset: Artemis II (modified)' })
    await expect(trigger).toHaveText('Preset: Artemis II (modified)')
    await expect(trigger).toBeVisible()
    await expectStackedHeader(header, true)
    expect((await trigger.boundingBox()).height).toBeGreaterThanOrEqual(40)
    await capture(page, 'header-stacked-mobile')
    await capture(page, 'layout-mobile')
    await capture(page, 'filters-header-mobile')
    await capture(page, 'preset-row-mobile')
    const addBox = await header.getByRole('button', { name: 'add filter' }).boundingBox()
    const tapY = addBox.y + addBox.height / 2 - 19
    expect(tapY).toBeLessThan(addBox.y)
    await page.mouse.click(addBox.x + addBox.width / 2, tapY)
    const addDialog = page.getByRole('dialog')
    await expect(addDialog.getByRole('button', { name: 'Apply filters' })).toBeVisible()
    await addDialog.getByRole('button', { name: 'close', exact: true }).click()
    await trigger.click()
    const picker = page.getByRole('dialog', { name: 'Choose a filter preset' })
    const search = picker.getByRole('searchbox', { name: 'Search presets' })
    await expect(search).toBeFocused()
    await expect(picker.getByRole('complementary', { name: 'Filter changes' })).not.toBeVisible()
    await expect(picker.getByRole('note')).toContainText('Presets change which filters are shown. Switching keeps your selected values, including Mission.')
    await capture(page, 'preset-menu-mobile')
    await search.fill('planetary')
    await picker.getByRole('button', { name: /^Planetary imaging/ }).click()
    await expect(picker.getByRole('group', { name: 'Kept filters for Planetary imaging' })).toBeVisible()
    await picker.getByRole('button', { name: 'Apply and keep filters', exact: true }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page).toHaveURL(/_preset=planetary-imaging.*mission=artemis2/)
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page).toHaveURL(/_preset=artemis-ii.*mission=artemis2/)
    await header.getByRole('button', { name: 'close filters', exact: true }).click()
    await expect(header).toHaveCount(0)
    await expect(page).toHaveURL(/_preset=artemis-ii.*mission=artemis2/)
})

const keptSearch = '/search?_preset=mars-2020&gather.common.mission=artemis2&gather.flyby_missions.flight_day_number=4_to_6&gather.common.mission_phase_name=FLYBY'

test('Atlas chooses kept filters in a pinned preview and undoes each switch', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockAtlas(page)
    await page.goto(keptSearch)
    const trigger = page.getByRole('button', { name: 'Preset: Mars 2020 (modified)', exact: true })
    const picker = page.getByRole('dialog', { name: 'Choose a filter preset' })
    const preview = picker.getByRole('complementary', { name: 'Filter changes' })
    const phase = preview.getByRole('group', { name: 'Keep or clear Mission Phase Name' })
    const flight = preview.getByRole('group', { name: 'Keep or clear Flight Day Number' })
    const ml = picker.getByRole('button', { name: /^ML-classified datasets/ })
    const phaseControl = page.getByRole('button', { name: /remove mission.phase.name filter/i })
    const flightControl = page.getByRole('button', { name: 'remove flight_day_number filter', exact: true })
    for (const [keepPhase, keepFlight] of [[true, false], [true, true], [false, false]]) {
        await trigger.click()
        const search = picker.getByRole('searchbox', { name: 'Search presets' })
        await expect(search).toBeFocused()
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')
        await expect(ml).toBeFocused()
        await ml.press('Enter')
        await expect(ml).toHaveAttribute('aria-pressed', 'true')
        await expect(page).toHaveURL(/_preset=mars-2020/)
        await ml.press('Tab')
        await expect(phase.getByRole('button', { name: 'Keep' })).toBeFocused()
        await expect(phase.getByRole('button', { name: 'Keep' })).toHaveAttribute('aria-pressed', 'true')
        await expect(picker.getByRole('button', { name: 'Apply and keep filters', exact: true })).toBeVisible()
        await expect(picker.getByRole('button', { name: /^(Keep all|Clear all kept)$/ })).toHaveCount(0)
        await flight.getByRole('button', { name: 'Clear' }).click()
        await expect(flight.getByRole('button', { name: 'Clear' })).toHaveAttribute('aria-pressed', 'true')
        await expect(picker.getByRole('button', { name: 'Apply and keep 1 filter', exact: true })).toBeVisible()
        if (keepFlight) {
            await flight.getByRole('button', { name: 'Keep' }).click()
        }
        if (!keepPhase) {
            await phase.getByRole('button', { name: 'Clear' }).click()
        }
        const apply = picker.getByRole('button', {
            name: `Apply and keep ${keepFlight ? 'filters' : keepPhase ? '1 filter' : '0 filters'}`,
            exact: true,
        })
        await expect(apply).toBeVisible()
        if (keepPhase && !keepFlight) {
            await capture(page, 'apply-button')
        }
        await apply.click()
        await expect(picker).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Preset: ML-classified datasets', exact: true })).toBeVisible()
        await expect(page).toHaveURL(/_preset=ml.*mission=artemis2/)
        await expect(phaseControl).toHaveCount(Number(keepPhase))
        await expect(flightControl).toHaveCount(Number(keepFlight))
        if (keepPhase) {
            await expect(page).toHaveURL(/mission_phase_name=FLYBY/)
        } else {
            await expect(page).not.toHaveURL(/mission_phase_name=/)
        }
        if (keepFlight) {
            await expect(page).toHaveURL(/flight_day_number=4_to_6/)
        } else {
            await expect(page).not.toHaveURL(/flight_day_number=/)
        }
        await page.getByRole('button', { name: 'Undo' }).click()
        await expect(trigger).toBeVisible()
        await expect(page).toHaveURL(/_preset=mars-2020.*mission=artemis2/)
        await expect(page).toHaveURL(/mission_phase_name=FLYBY/)
        await expect(page).toHaveURL(/flight_day_number=4_to_6/)
        await expect(phaseControl).toBeVisible()
        await expect(flightControl).toBeVisible()
    }
    await trigger.click()
    await ml.click()
    await expect(ml).toHaveAttribute('aria-pressed', 'true')
    await picker.getByRole('button', { name: /^Standard Atlas/ }).hover()
    await expect(preview.getByRole('heading', { name: 'Standard Atlas' })).toBeVisible()
    await preview.hover()
    await expect(preview.getByRole('heading', { name: 'ML-classified datasets' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(picker).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await picker.getByRole('button', { name: /^Artemis II/ }).hover()
    await expect(preview.getByRole('heading', { name: 'Artemis II' })).toBeVisible()
    await picker.getByRole('button', { name: /^Artemis II/ }).click()
    await picker.getByRole('button', { name: 'Apply and keep filters', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Preset: Artemis II', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(trigger).toBeVisible()
    await page.goto('/search?_preset=mars-2020&gather.common.mission=artemis2')
    await page.getByRole('button', { name: 'Preset: Mars 2020', exact: true }).click()
    const applyWithoutKeeps = picker.getByRole('button', { name: 'Apply', exact: true })
    await expect(applyWithoutKeeps).toBeVisible()
    await expect(applyWithoutKeeps).toBeDisabled()
    const active = picker.getByRole('button', { name: /^Mars 2020/ })
    await active.click()
    await expect(active).toHaveAttribute('aria-current', 'true')
    await expect(active).toHaveAttribute('aria-pressed', 'true')
    await expect(applyWithoutKeeps).toBeDisabled()
    await ml.click()
    await expect(ml).toHaveAttribute('aria-pressed', 'true')
    await expect(ml).not.toHaveAttribute('aria-current', 'true')
    await expect(active).toHaveAttribute('aria-pressed', 'false')
    await expect(active).toHaveAttribute('aria-current', 'true')
    await expect(page).toHaveURL(/_preset=mars-2020.*mission=artemis2/)
    await expect(applyWithoutKeeps).toBeEnabled()
    await ml.press('Tab')
    await expect(applyWithoutKeeps).toBeFocused()
    await applyWithoutKeeps.press('Enter')
    await expect(picker).not.toBeVisible()
    await expect(page).toHaveURL(/_preset=ml.*mission=artemis2/)
})

test('Atlas shows inline kept-filter choices on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await mockAtlas(page)
    await page.goto(keptSearch)
    await page.getByRole('button', { name: 'filters view', exact: true }).click()
    await page.getByRole('button', { name: 'Preset: Mars 2020 (modified)', exact: true }).click()
    const picker = page.getByRole('dialog', { name: 'Choose a filter preset' })
    await expect(picker.getByRole('button', { name: 'Apply', exact: true })).toBeInViewport()
    await expect(picker.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled()
    await picker.getByRole('searchbox').fill('ML-classified')
    await picker.getByRole('button', { name: /^ML-classified datasets/ }).click()
    await expect(picker.getByRole('complementary', { name: 'Filter changes' })).not.toBeVisible()
    const inline = picker.getByRole('group', { name: 'Kept filters for ML-classified datasets' })
    await inline.getByRole('group', { name: 'Keep or clear Flight Day Number' }).getByRole('button', { name: 'Clear' }).click()
    await expect(page).toHaveURL(/_preset=mars-2020/)
    const apply = picker.getByRole('button', { name: 'Apply and keep 1 filter', exact: true })
    await expect(apply).toBeInViewport()
    await capture(page, 'apply-button-mobile')
    await apply.click()
    await expect(picker).not.toBeVisible()
    await expect(page).toHaveURL(/_preset=ml.*mission=artemis2/)
    await expect(page).toHaveURL(/mission_phase_name=FLYBY/)
    await expect(page).not.toHaveURL(/flight_day_number=/)
})

test('Planetary Raws home opens its curated preset without exposing Atlas-only actions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1440 })
    await mockAtlas(page)
    await page.route('**/', async (route) => {
        if (route.request().resourceType() !== 'document') {
            return route.continue()
        }
        const response = await route.fetch()
        const body = (await response.text()).replace(/"APP_INSTANCE"\s*:\s*"atlas"/, '"APP_INSTANCE":"raws"')
        await route.fulfill({ response, body })
    })
    await page.goto('/')
    await expect(page.getByRole('main').getByRole('heading', { name: 'Planetary Raws', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Explore Missions' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse Planetary Raws', exact: true })).toHaveAttribute('href', '/search')
    await expect(page.getByRole('link', { name: /Archive Explorer/ })).toHaveCount(0)
    for (const [title, id] of [
        ['Mars 2020 · Perseverance', 'mars_2020'],
        ['Mars Science Laboratory · Curiosity', 'msl'],
        ['InSight', 'nsyt'],
        ['Cassini', 'cas'],
        ['Psyche', 'psyche'],
    ]) {
        const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
        const href = new RegExp(`[?&]gather\\.common\\.mission=${id}$`)
        await expect(card.getByRole('link', { name: title, exact: true })).toHaveAttribute('href', href)
        await expect(card.getByRole('link', { name: `Browse ${title} using the mission image` })).toHaveAttribute('href', href)
        await expect(card.getByRole('link', { name: `Browse ${title}`, exact: true })).toHaveAttribute('href', href)
    }
    await expect(page.getByRole('article')).toHaveCount(5)
    await capture(page, 'raws-home')
    await page.getByRole('link', { name: 'Browse Mars 2020 · Perseverance', exact: true }).click()
    await expect(page).toHaveURL(/_preset=mars-2020.*mission=mars_2020/)
    const subtitle = page.getByRole('group', { name: 'Filter preset' })
    await expect(subtitle.getByText('Preset: Mars 2020', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'add filter', exact: true })).toHaveCount(0)
    await expect(subtitle.getByRole('button')).toHaveCount(0)
    await capture(page, 'raws-preset')
    await page.setViewportSize({ width: 1440, height: 900 })
    await capture(page, 'header-stacked-raws')
})
