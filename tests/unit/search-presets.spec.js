import { test, expect } from '@playwright/test'
import { getAppConfig } from '../../src/core/appConfig'
import { FLIGHT_DAY, getFilterPresets } from '../../src/config/filterPresets'
import { getHomeConfig } from '../../src/config/home'
import { getHomeDestination } from '../../src/pages/Home/homeLinks'
import { applyBasicSearchParams, getPresetFilterKeys, getPresetFilterSummary, getPresetPreview, makePresetFilters, planPresetSwitch, sameFilterLayout } from '../../src/core/searchPresetState'
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

test('preset descriptions and summaries distinguish featured fields from new and hidden controls', () => {
    const atlas = getFilterPresets('atlas')
    const raws = getFilterPresets('raws')
    expect([...atlas, ...raws].every(({ description }) => Boolean(description.trim()))).toBe(true)
    expect(getPresetFilterSummary(atlas.find(({ id }) => id === 'artemis-ii'), [
        FLIGHT_DAY, MISSION, 'archive.bundle_id',
    ])).toEqual({ featured: [FLIGHT_DAY], added: [], hidden: ['archive.bundle_id'] })
    expect(getPresetFilterSummary(raws[0], [MISSION, 'gather.common.spacecraft'])).toEqual({
        featured: [], added: ['gather.landed_missions.planet_day_number'], hidden: ['gather.common.spacecraft'],
    })
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
    expect(Object.keys(plan.filters)).toEqual([MISSION, 'archive.bundle_id', FLIGHT_DAY, PHASE])
    expect(plan.filters[MISSION].facets[0].state).toEqual({ artemis2: true })
    expect(plan.filters[FLIGHT_DAY].facets[0].state).toEqual({ range: [4, 6] })
    expect(plan.filters[PHASE].facets[0].state).toEqual({ FLYBY: true })
    expect(current).toHaveProperty(['_text'])
    expect(sameFilterLayout(plan.filters, next)).toBe(false)
})

test('preview uses sidebar order, with removed filters inline and populated extras kept', () => {
    const kind = 'gather.common.kind'
    const bundle = 'archive.bundle_id'
    const ml = 'gather.machine_learning.classification.classifications.class'
    const extra = 'gather.common.custom_filter'
    const empty = { facets: [] }
    const value = { facets: [{ state: { selected: true } }] }
    const current = { [extra]: empty, [kind]: empty, [PHASE]: value, [MISSION]: value, [bundle]: empty, [FLIGHT_DAY]: value }
    const next = { [ml]: empty, [MISSION]: empty, _text: empty }
    expect(getPresetPreview(current, next, false).rows.map(({ key, status }) => [key, status])).toEqual([
        ['_text', 'added'],
        [MISSION, 'unchanged'],
        [kind, 'removed'],
        [extra, 'removed'],
        [PHASE, 'kept'],
        [FLIGHT_DAY, 'kept'],
        [bundle, 'removed'],
        [ml, 'added'],
    ])
    const active = getPresetPreview(current, next, true)
    expect(active.isActive).toBe(true)
    expect(active.rows.map(({ key, status }) => [key, status])).toEqual([
        [MISSION, 'unchanged'], [kind, 'unchanged'], [extra, 'unchanged'], [PHASE, 'unchanged'],
        [FLIGHT_DAY, 'unchanged'], [bundle, 'unchanged'],
    ])
})
