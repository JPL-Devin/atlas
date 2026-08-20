import { defaultProfile, fields, instanceProfiles, profiles } from '../../config/recordDetail'
import { getIn } from '../utils'
import { formatValue } from './formatters'
import { isValidValue } from './validity'

export const TOKEN = /\{\{\s*([\w.]+)\s*\}\}/g

const first = (value) => (Array.isArray(value) ? value[0] : value)

const PATHS = {
    mission: 'gather.common.mission',
    pds_standard: 'gather.pds_archive.pds_standard',
    instrument: 'gather.common.instrument',
}

// Scalars replace; `tiles` and each caption variant replace wholesale. There is
// no null-to-suppress and no order arithmetic — a child restates its list.
const mergeLayer = (base, layer) => {
    if (layer == null) return base
    const merged = { ...base }
    Object.keys(layer).forEach((key) => {
        if (key === 'instruments' || key === 'missions' || key === 'match') return
        merged[key] = layer[key]
    })
    return merged
}

/**
 * `_default` → mission → mission.pds_standard → instance mission → instance
 * instrument. Instance layers exist only for editorial overrides.
 */
export const resolveProfile = ({ mission, pds_standard, instrument, instance } = {}) => {
    let profile = mergeLayer({}, defaultProfile)

    if (mission) {
        profile = mergeLayer(profile, profiles[mission])
        if (pds_standard) profile = mergeLayer(profile, profiles[`${mission}.${pds_standard}`])

        const instanceProfile = instance ? instanceProfiles[instance] : null
        const instanceMission = instanceProfile ? getIn(instanceProfile, ['missions', mission]) : null
        if (instanceMission) {
            profile = mergeLayer(profile, instanceMission)
            if (instrument)
                profile = mergeLayer(profile, getIn(instanceMission, ['instruments', instrument]))
        }
    }

    return profile
}

const readTile = (recordData, path) => {
    const field = fields[path]
    if (field == null) return null
    const raw = getIn(recordData, path)
    if (!isValidValue(raw, field)) return null
    const value = formatValue(raw, field)
    if (value == null) return null
    return {
        label: field.label,
        shortLabel: field.shortLabel || field.label,
        value,
    }
}

const CAPTION_SEPARATOR = ' \u00b7 '

const renderFragments = (recordData, fragments, separator = ' ') => {
    if (!Array.isArray(fragments)) return null
    const rendered = fragments
        .map((fragment) => {
            let dropped = false
            const text = String(fragment).replace(TOKEN, (match, path) => {
                const tile = readTile(recordData, path)
                if (tile == null) dropped = true
                return tile ? tile.value : ''
            })
            return dropped ? null : text.trim()
        })
        .filter((text) => text != null && text !== '')
    return rendered.length ? rendered.join(separator) : null
}

/**
 * Resolves a record into display-ready strings and label/value tiles. Field
 * paths, profiles and caption templates never leave this module.
 */
export const resolvePresentation = (recordData, { instance } = {}) => {
    const mission = first(getIn(recordData, PATHS.mission))
    const pds_standard = first(getIn(recordData, PATHS.pds_standard))
    const instrument = first(getIn(recordData, PATHS.instrument))

    const profile = resolveProfile({ mission, pds_standard, instrument, instance })

    const maxTiles = profile.maxTiles != null ? profile.maxTiles : 8
    const tiles = []
    ;(profile.tiles || []).forEach((path) => {
        if (tiles.length >= maxTiles) return
        const tile = readTile(recordData, path)
        if (tile) tiles.push(tile)
    })

    // Fragments carry no separators of their own, so a dropped fragment can
    // never leave a dangling dash or comma behind.
    const separator = profile.separator != null ? profile.separator : CAPTION_SEPARATOR

    return {
        caption: renderFragments(recordData, profile.caption, separator),
        shortCaption:
            renderFragments(recordData, profile.shortCaption, separator) ||
            renderFragments(recordData, profile.caption, separator),
        altText: renderFragments(recordData, profile.altText),
        citation: renderFragments(recordData, profile.citation),
        tiles,
        priorityTiles: profile.priorityTiles != null ? profile.priorityTiles : tiles.length,
        emptyState: profile.emptyState || 'no_browse_generic',
    }
}
