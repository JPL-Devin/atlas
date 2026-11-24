import { getFilterOrderValue } from './FacetBuilder'

const GROUP_ORDER = [
    null,
    'common',
    'time',
    'flyby_missions',
    'archive',
    'machine_learning',
    'ancillary',
    'pds_archive',
    'pds4_label',
    'pds3_label',
]

const getGroupKey = (key) => {
    if (key === '_text') {
        return null
    }
    const parts = key.split('.')
    return parts[0] === 'gather' && parts.length > 1 ? parts[1] : parts[0]
}

export const getFilterDisplayGroups = (keys, getOrder = getFilterOrderValue) => {
    const groups = new Map()
    for (const key of [...keys].sort((a, b) => getOrder(a) - getOrder(b))) {
        const group = getGroupKey(key)
        if (!groups.has(group)) {
            groups.set(group, [])
        }
        groups.get(group).push(key)
    }
    return [...groups].sort(([a], [b]) => {
        const ai = GROUP_ORDER.indexOf(a)
        const bi = GROUP_ORDER.indexOf(b)
        if (ai >= 0 && bi >= 0) {
            return ai - bi
        }
        if (ai >= 0) {
            return -1
        }
        if (bi >= 0) {
            return 1
        }
        return a.localeCompare(b)
    })
}
