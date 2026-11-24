import { test, expect } from '@playwright/test'
import { getAllInstances, getAppConfig } from '../../src/core/appConfig'
import { FLIGHT_DAY, getFilterPresets } from '../../src/config/filterPresets'
import { getHomeConfig } from '../../src/config/home'
import { getHomeDestination } from '../../src/pages/Home/homeLinks'
import { applyBasicSearchParams, getPresetFilterKeys, getPresetFilterSummary, getPresetPreview, makePresetFilters, planPresetSwitch, sameFilterLayout } from '../../src/core/searchPresetState'
import { formatMappings } from '../../src/facets/FacetBuilder'

const MISSION = 'gather.common.mission'
const SPACECRAFT = 'gather.common.spacecraft'
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
            if (card.preset) {
                expect(presets.some(({ id }) => id === card.preset)).toBe(true)
            }
            if (instance === 'raws') {
                expect(getHomeDestination('archive', card)).toBeNull()
            } else {
                expect(search.searchParams.get(MISSION)).toBe(card.id)
                expect(getHomeDestination('archive', card)).toBe(`/archive-explorer?mission=${card.id}`)
                expect(search.searchParams.has(SPACECRAFT)).toBe(false)
            }
        }
    }
    const rawsCards = getHomeConfig('raws').cards
    expect(new Set(rawsCards.map(({ id }) => id)).size).toBe(rawsCards.length)
    expect(rawsCards.map((card) => {
        const { searchParams } = new URL(getHomeDestination('search', card), 'http://localhost')
        return [searchParams.get(MISSION), searchParams.get(SPACECRAFT), searchParams.get('_preset')]
    })).toEqual([
        ['m20', 'perseverance', 'mars-2020'], ['m20', 'ingenuity', 'mars-2020'],
        ['msl', 'curiosity', 'msl'], ['insight', 'insight', 'insight'],
        ['cassini', 'cassini', 'cassini'], ['psyche', 'psyche', 'psyche'],
    ])
    expect(getHomeDestination('search', {
        query: { 'gather.common.target': ['Mars & Phobos', 'Deimos'] },
        destinations: { search: {} },
    })).toBe('/search?gather.common.target=Mars%20%26%20Phobos,Deimos')
    expect(getHomeDestination('search')).toBe('/search')
})

test('home card images identify their NASA Photojournal sources and credits', () => {
    for (const instance of ['atlas', 'raws']) {
        const images = getHomeConfig(instance).cards.map(({ image }) => image)
        expect(new Set(images.map(({ piaId }) => piaId)).size).toBe(images.length)
        for (const { file, piaId, source, alt, credit } of images) {
            expect(piaId).toMatch(/^PIA\d{5}$/)
            expect(file).toMatch(new RegExp(`^[a-z0-9-]+-${piaId.toLowerCase()}\\.webp$`))
            expect(source).toMatch(/^https:\/\/science\.nasa\.gov\/photojournal\/[a-z0-9-]+\/$/)
            expect(alt).toBeTruthy()
            expect(credit).toBeTruthy()
        }
    }
})

test('Raws presets keep standard controls and add Planet Day only for landed missions', () => {
    const { defaultFilters } = getAllInstances().raws
    const presets = getFilterPresets('raws')
    expect(presets.map(({ id, label }) => [id, label])).toEqual([
        ['all', 'Standard Planetary Raws'], ['mars-2020', 'Mars 2020'], ['msl', 'Mars Science Laboratory'],
        ['insight', 'InSight'], ['cassini', 'Cassini'], ['psyche', 'Psyche'],
    ])
    expect(defaultFilters).toContain(SPACECRAFT)
    for (const preset of presets) {
        const landed = ['mars-2020', 'msl', 'insight'].includes(preset.id)
        expect(getPresetFilterKeys(preset, defaultFilters)).toEqual(landed
            ? [...defaultFilters, 'gather.landed_missions.planet_day_number']
            : defaultFilters)
    }
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
    expect(atlas.find(({ id }) => id === 'all')?.label).toBe('Standard Atlas')
    expect([...atlas, ...raws].every(({ description }) => Boolean(description.trim()))).toBe(true)
    expect(getPresetFilterSummary(atlas.find(({ id }) => id === 'artemis-ii'), [
        FLIGHT_DAY, MISSION, 'archive.bundle_id',
    ])).toEqual({ featured: [FLIGHT_DAY], added: [], hidden: ['archive.bundle_id'] })
    expect(getPresetFilterSummary(raws.find(({ id }) => id === 'mars-2020'), [MISSION, SPACECRAFT])).toEqual({
        featured: [], added: ['gather.landed_missions.planet_day_number'], hidden: [],
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
    expect(sameFilterLayout(plan.filters, next, plan.kept)).toBe(true)
    expect(sameFilterLayout({ ...plan.filters, manual: { facets: [] } }, next, plan.kept)).toBe(false)
    expect(sameFilterLayout({ [PHASE]: current[PHASE] }, next, plan.kept)).toBe(false)

    const mixed = planPresetSwitch(current, next, [FLIGHT_DAY, MISSION])
    expect(mixed.kept).toEqual([PHASE])
    expect(mixed.removed).toEqual(['_text', FLIGHT_DAY])
    expect(mixed.filters[MISSION]).toBe(current[MISSION])
    expect(mixed.filters[PHASE]).toBe(current[PHASE])
    expect(mixed.filters[FLIGHT_DAY]).toBeUndefined()
    expect(current[FLIGHT_DAY].facets[0].state).toEqual({ range: [4, 6] })

    const cleared = planPresetSwitch(current, next, plan.kept)
    expect(cleared.kept).toEqual([])
    expect(sameFilterLayout(cleared.filters, next)).toBe(true)
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
