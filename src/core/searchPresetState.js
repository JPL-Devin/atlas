import { getAppConfig } from './appConfig'
import { getInitialActiveFilters, getMappedFilter } from '../facets/FacetBuilder'

export const getPresetFilterKeys = (preset, defaults = getAppConfig().defaultFilters) =>
    [...new Set([...defaults.filter((key) => !preset?.remove.includes(key)), ...(preset?.add || [])])]

export const getPresetFilterSummary = (preset, defaults = getAppConfig().defaultFilters) => {
    const defaultKeys = new Set(defaults)
    const presetKeys = new Set(getPresetFilterKeys(preset, defaults))
    const highlighted = [...new Set(preset.add)]
    return {
        featured: highlighted.filter((key) => defaultKeys.has(key)),
        added: highlighted.filter((key) => !defaultKeys.has(key)),
        hidden: [...defaultKeys].filter((key) => !presetKeys.has(key)),
    }
}

export const makePresetFilters = (mapping, preset, defaultValues = getAppConfig().defaultFilterValues) => {
    const filters = structuredClone(getInitialActiveFilters(mapping, getPresetFilterKeys(preset)))
    Object.entries(defaultValues || {}).forEach(([key, values]) => {
        if (filters[key]?.facets[0]) {
            filters[key].facets[0].state = structuredClone(values)
        }
    })
    return filters
}

export const hasFilterValue = (filter) =>
    filter?.facets.some(({ state = {} }) =>
        Object.values(state || {}).some((value) => {
            if (Array.isArray(value)) {
                return value.some((item) => item != null && item !== '')
            }
            if (value && typeof value === 'object') {
                return Object.values(value).some(Boolean)
            }
            return value === true || typeof value === 'number' || (typeof value === 'string' && value !== '')
        })
    ) || false

export const sameFilterLayout = (filters, defaults) =>
    Object.keys(filters).length === Object.keys(defaults).length &&
    Object.keys(filters).every((key) => Object.hasOwn(defaults, key))

export const planPresetSwitch = (current, defaults) => {
    const added = Object.keys(defaults).filter((key) => !current[key])
    const extras = Object.keys(current).filter((key) => !defaults[key])
    const kept = extras.filter((key) => hasFilterValue(current[key]))
    const removed = extras.filter((key) => !kept.includes(key))
    const filters = Object.fromEntries([
        ...Object.keys(defaults).map((key) => [key, current[key] || defaults[key]]),
        ...kept.map((key) => [key, current[key]]),
    ])
    return { added, removed, kept, filters }
}

export const applyBasicSearchParams = (query, current, mapping) => {
    const filters = { ...current }
    Object.entries(query).forEach(([key, value]) => {
        if (key[0] === '_' && key !== '_text') {
            return
        }
        const [, mainKey, facetIndex] = /^(.*?)(?:-(\d+))?$/.exec(key)
        const index = Number(facetIndex || 0)
        const filter = Object.hasOwn(filters, mainKey) ? filters[mainKey] : getMappedFilter(mapping, mainKey)
        const facet = filter?.facets?.[index]
        if (!facet || !value) {
            return
        }
        let state
        if (['query_string', 'text', 'number'].includes(facet.type)) {
            state = { input: value }
        } else if (['date_range', 'input_range', 'slider_range'].includes(facet.type)) {
            if (!value.includes('_to_')) {
                return
            }
            const [start, end] = value.split('_to_')
            state = facet.type === 'date_range'
                ? { daterange: { start, end } }
                : { range: [start === '' ? null : Number(start), end === '' ? null : Number(end)] }
            if (state.range?.some(Number.isNaN)) {
                return
            }
        } else if (facet.type === 'keyword') {
            state = Object.fromEntries(value.split(',').filter(Boolean).map((item) => [item, true]))
        } else {
            return
        }

        const next = structuredClone(filter)
        next.facets[index].state = { ...(facet.state?.exclude ? { exclude: facet.state.exclude } : {}), ...state }
        filters[mainKey] = next
    })
    return filters
}
