import { capitalize, prettify, isObject, objectToString } from '../../../../../../core/utils'

export const MAP_BOUNDARY_FILTER_KEY = 'bounding_box'

// Degrees with a hemisphere suffix, e.g. -12.42 => 12.4°S
const formatDegrees = (value, positive, negative) =>
    `${Math.abs(value).toFixed(1)}°${value < 0 ? negative : positive}`

const getMapAreaChip = (filter) => {
    const lon = filter.facets?.[0]?.state?.range
    const lat = filter.facets?.[1]?.state?.range
    if (lon == null || lat == null || lon.length !== 2 || lat.length !== 2) return null

    const corner = (latValue, lonValue) =>
        `${formatDegrees(latValue, 'N', 'S')} ${formatDegrees(lonValue, 'E', 'W')}`

    return {
        id: MAP_BOUNDARY_FILTER_KEY,
        label: `Map area: ${corner(lat[0], lon[0])} ➔ ${corner(lat[1], lon[1])}`,
        isMapBoundary: true,
    }
}

// Describes each applied filter value as `{ id, label }` plus either `isMapBoundary`
// or the `filterKey`/`facetId`/`stateKey` needed to unset it.
export const getActiveFilterChips = (activeFilters) => {
    const chips = []

    Object.keys(activeFilters).forEach((filterKey) => {
        const filter = activeFilters[filterKey]
        if (filter == null || filter.facets == null) return

        if (filterKey === MAP_BOUNDARY_FILTER_KEY) {
            const mapAreaChip = getMapAreaChip(filter)
            if (mapAreaChip != null) chips.push(mapAreaChip)
            return
        }

        filter.facets.forEach((facet, facetId) => {
            if (!facet.state) return

            Object.keys(facet.state).forEach((stateKey) => {
                if (stateKey === 'exclude') return
                let value = facet.state[stateKey]
                if (stateKey === '__filter' && (value == '' || value == null)) return
                if (value === false) return
                if (value === true) value = stateKey

                if (typeof value !== 'string' && value.length === 2) {
                    if (value[0] == null && value[1] == null) return
                    value = `${value[0].toFixed(2)} ➔ ${value[1].toFixed(2)}`
                } else if (isObject(value)) 
                    value = objectToString(value)
                

                let subName = ''
                if (filter.facets.length > 1)
                    subName = ` (${facet.display_name || prettify(facet.field_name)})`

                chips.push({
                    id: `${filterKey}-${facetId}-${stateKey}`,
                    label: `${capitalize(filter.display_name || filterKey)}${subName}: ${
                        stateKey === '__filter' ? `*${value}*` : value
                    }`,
                    filterKey,
                    facetId,
                    stateKey,
                    currentValue: facet.state[stateKey],
                })
            })
        })
    })

    return chips
}
