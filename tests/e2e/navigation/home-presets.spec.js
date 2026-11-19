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
    if (process.env.ATLAS_SCREENSHOT_DIR)
        await page.screenshot({ path: path.join(process.env.ATLAS_SCREENSHOT_DIR, name + '.png'), animations: 'disabled' })
}

test.use({ viewport: { width: 1440, height: 900 } })

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
    await expect(page.getByText('Filter preset', { exact: true })).toBeVisible()
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
    await expect(page.getByText('In preset', { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/mission_phase_name=FLYBY/)
    await capture(page, 'preset-artemis')
    await page.getByRole('button', { name: 'Change', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Mars 2020', exact: true }).click()
    const change = page.getByRole('dialog', { name: 'Switch to Mars 2020 preset?' })
    await expect(change.getByText('Kept · has value')).toBeVisible()
    await capture(page, 'preset-switch')
    await change.getByRole('button', { name: 'Switch preset' }).click()
    await expect(page).toHaveURL(/_preset=mars-2020.*mission=artemis2/)
    await expect(page.getByText('Kept · has value', { exact: true }).first()).toBeVisible()
    await capture(page, 'preset-switched')
    await page.getByRole('button', { name: /remove mission.phase.name filter/i }).click()
    const remove = page.getByRole('dialog', { name: /remove mission phase name/i })
    await expect(remove.getByText(/clears its selected values/)).toBeVisible()
    await remove.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page).toHaveURL(/_preset=artemis-ii/)

    await page.getByRole('button', { name: 'add filter', exact: true }).click()
    const add = page.getByRole('dialog')
    await expect(add.getByText('In this preset', { exact: true })).toBeVisible()
    await expect(add.getByText('Recommended for Artemis II', { exact: true })).toBeVisible()
    await expect(add.getByText('All fields', { exact: true })).toBeVisible()
    await capture(page, 'preset-add')
    await add.getByRole('checkbox', { name: 'Bundle ID' }).check()
    await add.getByRole('checkbox', { name: 'Mission', exact: true }).uncheck()
    await add.getByRole('button', { name: 'Apply filters' }).click()
    await expect(add.getByText(/will also clear the selected values/)).toBeVisible()
    await add.getByRole('button', { name: 'Apply and clear values' }).click()
    await expect(page.getByText('Modified', { exact: true })).toBeVisible()
    await expect(page).not.toHaveURL(/gather\.common\.mission=/)

    await page.getByRole('button', { name: 'reset filters' }).click()
    await capture(page, 'preset-reset')
    await page.getByRole('menuitem', { name: 'Reset to Artemis II preset' }).click()
    await expect(page).toHaveURL(/mission=artemis2/)
    await page.getByRole('button', { name: 'Clear preset', exact: true }).click()
    await expect(page).not.toHaveURL(/_preset=/)
    await expect(page).toHaveURL(/mission=artemis2/)
})

test('Planetary Raws home opens its curated preset without exposing Atlas-only actions', async ({ page }) => {
    await mockAtlas(page)
    await page.route('**/', async (route) => {
        if (route.request().resourceType() !== 'document') return route.continue()
        const response = await route.fetch()
        const body = (await response.text()).replace(/"APP_INSTANCE"\s*:\s*"atlas"/, '"APP_INSTANCE":"raws"')
        await route.fulfill({ response, body })
    })
    await page.goto('/')
    await expect(page.getByRole('main').getByRole('heading', { name: 'Planetary Raws', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Explore Missions' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse Planetary Raws', exact: true })).toHaveAttribute('href', '/search')
    await expect(page.getByRole('link', { name: /Archive Explorer/ })).toHaveCount(0)
    await capture(page, 'raws-home')
    await page.getByRole('link', { name: 'Browse Mars 2020 · Perseverance', exact: true }).click()
    await expect(page).toHaveURL(/_preset=mars-2020.*mission=mars_2020/)
    await expect(page.getByText('Filter preset', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'add filter', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Change', exact: true })).toHaveCount(0)
    await capture(page, 'raws-preset')
})
