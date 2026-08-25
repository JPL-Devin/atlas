import {
    defaultProfile,
    fields,
    instanceProfiles,
    otherFields as otherConfig,
    profiles,
    sections as sectionGroups,
} from '../../config/recordDetail'
import { getIn } from '../utils'
import { formatValue } from './formatters'
import { readOtherRows } from './otherFields'
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
        const instanceMission = instanceProfile
            ? getIn(instanceProfile, ['missions', mission])
            : null
        if (instanceMission) {
            profile = mergeLayer(profile, instanceMission)
            if (instrument)
                profile = mergeLayer(profile, getIn(instanceMission, ['instruments', instrument]))
        }
    }

    return profile
}

const readTile = (recordData, path, format) => {
    const catalogued = fields[path]
    if (catalogued == null) return null
    // A tile may ask for a more compact format than the catalogued one.
    const field = format != null ? { ...catalogued, format } : catalogued
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

// A tile is a path, or { path, sub, inline, format } where `sub` adds a second
// field beside (inline) or under the value. The sub drops on its own.
const readTileEntry = (recordData, entry) => {
    const path = typeof entry === 'string' ? entry : entry.path
    const format = typeof entry === 'string' ? null : entry.format
    const tile = readTile(recordData, path, format)
    if (tile == null) return null
    const empty = { ...tile, sub: null, inline: false }
    if (typeof entry === 'string' || entry.sub == null) return empty

    const sub = readTile(recordData, entry.sub, entry.subFormat)
    if (sub == null) return empty
    const microLabel = getIn(fields, [entry.sub, 'microLabel'])
    const prefix = microLabel != null ? microLabel : sub.shortLabel
    return {
        ...tile,
        sub: prefix === '' ? sub.value : `${prefix} ${sub.value}`,
        inline: entry.inline === true,
    }
}

// Sections are named groups of normalized paths (config/recordDetail/sections.json);
// rows with no value drop, and a section with no rows drops with them.
// A row whose exact value is already a tile above is dropped, so At a glance
// and the field sections stop repeating each other.
const readSections = (recordData, ids, tiled = {}) =>
    (Array.isArray(ids) ? ids : [])
        .map((id) => {
            const group = sectionGroups[id]
            if (group == null) return null
            const rows = []
            group.fields.forEach((path) => {
                const tile = readTile(recordData, path)
                if (tile == null || tiled[path] === tile.value) return
                rows.push({ label: tile.label, value: tile.value })
            })
            return rows.length ? { id, title: group.title, rows } : null
        })
        .filter((section) => section != null)

// Every path the configured sections lay claim to, shown or not.
const configuredPaths = (ids) =>
    (Array.isArray(ids) ? ids : []).reduce(
        (paths, id) => (sectionGroups[id] ? paths.concat(sectionGroups[id].fields) : paths),
        []
    )

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
    const tiled = {}
    ;(profile.tiles || []).forEach((entry) => {
        if (tiles.length >= maxTiles) return
        const tile = readTileEntry(recordData, entry)
        if (tile == null) return
        tiles.push(tile)
        const path = typeof entry === 'string' ? entry : entry.path
        tiled[path] = tile.value
        if (typeof entry !== 'string' && entry.sub != null && tile.sub != null) {
            const sub = readTile(recordData, entry.sub, entry.subFormat)
            if (sub != null) tiled[entry.sub] = sub.value
        }
    })

    // Fragments carry no separators of their own, so a dropped fragment can
    // never leave a dangling dash or comma behind.
    const separator = profile.separator != null ? profile.separator : CAPTION_SEPARATOR

    // The author leads the citation and also stands alone on the caption card.
    const citationAuthor = renderFragments(recordData, profile.citationAuthor, ', ')
    const citationBody = renderFragments(recordData, profile.citation, ', ')
    const citation = [citationAuthor, citationBody].filter((part) => part != null).join(', ')

    // Whatever the profile didn't place lands in one trailing catch-all section.
    const sections = readSections(recordData, profile.sections, tiled)
    const otherRows =
        profile.otherFields === false
            ? []
            : readOtherRows(recordData, { usedPaths: configuredPaths(profile.sections) })
    if (otherRows.length) sections.push({ id: 'other', title: otherConfig.title, rows: otherRows })

    return {
        // Description fragments are whole sentences, so a dropped clause leaves
        // grammatical prose behind.
        description: renderFragments(recordData, profile.description, ' '),
        caption: renderFragments(recordData, profile.caption, separator),
        captionTitle: renderFragments(recordData, profile.captionTitle, separator),
        captionChips: readChips(recordData, profile.captionChips),
        sections,
        shortCaption:
            renderFragments(recordData, profile.shortCaption, separator) ||
            renderFragments(recordData, profile.caption, separator),
        altText: renderFragments(recordData, profile.altText),
        citationAuthor,
        citation: citation === '' ? null : citation,
        tiles,
        priorityTiles: profile.priorityTiles != null ? profile.priorityTiles : tiles.length,
        emptyState: profile.emptyState || 'no_browse_generic',
    }
}
