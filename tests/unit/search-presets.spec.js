import { test, expect } from '@playwright/test'
import { getAppConfig } from '../../src/core/appConfig'
import { FLIGHT_DAY, getFilterPresets } from '../../src/config/filterPresets'
import { getHomeConfig } from '../../src/config/home'
import { getHomeDestination } from '../../src/pages/Home/homeLinks'
import { applyBasicSearchParams, getPresetFilterKeys, makePresetFilters, planPresetSwitch, sameFilterLayout } from '../../src/core/searchPresetState'
import { formatMappings } from '../../src/facets/FacetBuilder'

const MISSION = 'gather.common.mission'
const PHASE = 'gather.common.mission_phase_name'
const mapping = formatMappings({ mappings: { properties: {
    gather: { properties: {
        common: { properties: { mission: { type: 'keyword' }, mission_phase_name: { type: 'keyword' } } },
        flyby_missions: { properties: { flight_day_number: { type: 'integer' } } },
    } },
} } })

test('home defines valid instance-local preset IDs and destination-specific queries', () => {
    for (const instance of ['atlas', 'raws']) {
        const presets = getFilterPresets(instance)
        for (const card of getHomeConfig(instance).cards) {
            const search = new URL(getHomeDestination('search', card), 'http://localhost')
            expect(search.searchParams.get('_preset')).toBe(card.preset ?? null)
            expect(search.searchParams.get(MISSION)).toBe(card.id)
            if (card.preset) {
                expect(presets.some(({ id }) => id === card.preset)).toBe(true)
            }
            if (instance === 'raws') {
                expect(getHomeDestination('archive', card)).toBeNull()
            } else {
                expect(getHomeDestination('archive', card)).toBe(`/archive-explorer?mission=${card.id}`)
            }
        }
    }
    expect(getHomeConfig('raws').cards.map(({ id }) => id)).toEqual([
        'mars_2020', 'msl', 'nsyt', 'cas', 'psyche',
    ])
    expect(getHomeDestination('search', {
        query: { 'gather.common.target': ['Mars & Phobos', 'Deimos'] },
        destinations: { search: {} },
    })).toBe('/search?gather.common.target=Mars%20%26%20Phobos,Deimos')
    expect(getHomeDestination('search')).toBe('/search')
})

test('Artemis II does not duplicate Flight Day or alter instance defaults', () => {
    const defaults = getAppConfig().defaultFilters
    const artemis = getFilterPresets('atlas').find(({ id }) => id === 'artemis-ii')
    const keys = getPresetFilterKeys(artemis)
    expect(keys.filter((key) => key === FLIGHT_DAY)).toHaveLength(1)
    expect(keys).not.toContain('archive.bundle_id')
    expect(defaults).toContain('archive.bundle_id')
})

test('deep links add mapped non-default fields and preset switching never discards chosen values', () => {
    const initial = makePresetFilters(mapping, undefined, {})
    const current = applyBasicSearchParams({
        [MISSION]: 'artemis2',
        [PHASE]: 'FLYBY',
        [FLIGHT_DAY]: '4_to_6',
        unknown: 'no',
        constructor: 'ignored',
    }, initial, mapping)
    expect(current[PHASE].facets[0].state).toEqual({ FLYBY: true })
    expect(current[FLIGHT_DAY].facets[0].state).toEqual({ range: [4, 6] })
    expect(current.unknown).toBeUndefined()
    expect(Object.hasOwn(current, 'constructor')).toBe(false)
    expect(initial[MISSION].facets[0].state).toBeUndefined()

    const next = { [MISSION]: initial[MISSION], 'archive.bundle_id': { facets: [] } }
    const plan = planPresetSwitch(current, next)
    expect(plan.added).toEqual(['archive.bundle_id'])
    expect(plan.removed).toEqual(['_text'])
    expect(plan.kept).toEqual([FLIGHT_DAY, PHASE])
    expect(plan.filters[MISSION].facets[0].state).toEqual({ artemis2: true })
    expect(sameFilterLayout(plan.filters, next)).toBe(false)
})
