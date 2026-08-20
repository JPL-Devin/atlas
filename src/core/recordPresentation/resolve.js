import {
    defaultProfile,
    fields,
    instanceProfiles,
    profiles,
    sections as sectionGroups,
} from '../../config/recordDetail'
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
        icon: field.icon || null,
        value,
    }
}

// A tile is a path, or { path, sub } where `sub` adds a second field on a
// smaller line under the value. The sub-line drops on its own.
const readTileEntry = (recordData, entry) => {
    const path = typeof entry === 'string' ? entry : entry.path
    const tile = readTile(recordData, path)
    if (tile == null) return null
    if (typeof entry === 'string' || entry.sub == null) return { ...tile, sub: null }

    const sub = readTile(recordData, entry.sub)
    if (sub == null) return { ...tile, sub: null }
    const microLabel = getIn(fields, [entry.sub, 'microLabel'])
    const prefix = microLabel != null ? microLabel : sub.shortLabel
    return { ...tile, sub: prefix === '' ? sub.value : `${prefix} ${sub.value}` }
}

// Sections are named groups of normalized paths (config/recordDetail/sections.json);
// rows with no value drop, and a section with no rows drops with them.
const readSections = (recordData, ids) =>
    (Array.isArray(ids) ? ids : [])
        .map((id) => {
            const group = sectionGroups[id]
            if (group == null) return null
            const rows = []
            group.fields.forEach((path) => {
                const tile = readTile(recordData, path)
                if (tile) rows.push({ label: tile.label, value: tile.value })
            })
            return rows.length ? { id, title: group.title, rows } : null
        })
        .filter((section) => section != null)

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

// A chip is a fragment string; it drops whole when any path it names is absent.
const readChips = (recordData, chips) =>
    (Array.isArray(chips) ? chips : [])
        .map((chip) => renderFragments(recordData, [chip]))
        .filter((chip) => chip != null)

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
    ;(profile.tiles || []).forEach((entry) => {
        if (tiles.length >= maxTiles) return
        const tile = readTileEntry(recordData, entry)
        if (tile) tiles.push(tile)
    })

    // Fragments carry no separators of their own, so a dropped fragment can
    // never leave a dangling dash or comma behind.
    const separator = profile.separator != null ? profile.separator : CAPTION_SEPARATOR

    return {
        caption: renderFragments(recordData, profile.caption, separator),
        captionTitle: renderFragments(recordData, profile.captionTitle, separator),
        captionChips: readChips(recordData, profile.captionChips),
        sections: readSections(recordData, profile.sections),
        shortCaption:
            renderFragments(recordData, profile.shortCaption, separator) ||
            renderFragments(recordData, profile.caption, separator),
        altText: renderFragments(recordData, profile.altText),
        citation: renderFragments(recordData, profile.citation, ', '),
        tiles,
        priorityTiles: profile.priorityTiles != null ? profile.priorityTiles : tiles.length,
        emptyState: profile.emptyState || 'no_browse_generic',
    }
}
