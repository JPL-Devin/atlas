import fields from '../../config/fields.json'
import {
    defaultProfile,
    instanceProfiles,
    profiles,
    sections as sectionGroups,
} from '../../config/recordDetail'
import { getIn } from '../utils'
import { formatElapsed, formatValue, parseTime } from './formatters'
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
        description: field.description || null,
        icon: field.icon || null,
        value,
    }
}

// A tile is a path, or { path, pair, format } where `pair` shows a second field
// of equal weight beside the first. The pair drops on its own.
const readTileEntry = (recordData, entry) => {
    const path = typeof entry === 'string' ? entry : entry.path
    const format = typeof entry === 'string' ? null : entry.format
    const tile = readTile(recordData, path, format)
    if (tile == null) return null
    const empty = { ...tile, pair: null }
    if (typeof entry === 'string' || entry.pair == null) return empty

    const pair = readTile(recordData, entry.pair, entry.pairFormat)
    if (pair == null) return empty
    return { ...tile, pair }
}

/**
 * A timeline entry is a normalized timestamp path, or `{ path, color }` to name
 * the node's swatch. Entries with no valid date drop, and fewer than two leaves
 * nothing to chart. Nodes are evenly spaced with the elapsed gap named between
 * them, since the real spans differ by orders of magnitude.
 */
const readTimeline = (recordData, entries) => {
    const points = (Array.isArray(entries) ? entries : [])
        .map((entry) => {
            const path = typeof entry === 'string' ? entry : entry.path
            const tile = readTile(recordData, path, 'datetime_short')
            if (tile == null) return null
            const at = parseTime(first(getIn(recordData, path)))
            if (at == null) return null
            const color = typeof entry === 'string' ? null : entry.color || null
            return {
                label: tile.shortLabel,
                value: tile.value,
                description: tile.description,
                color,
                at,
            }
        })
        .filter((point) => point != null)
        .sort((a, b) => a.at - b.at)

    if (points.length < 2) return []
    return points.map((point, i) => ({
        label: point.label,
        value: point.value,
        description: point.description,
        color: point.color,
        gap: i === 0 ? null : formatElapsed(point.at - points[i - 1].at),
    }))
}

// Sections are named groups of normalized paths (config/recordDetail/sections.json);
// rows with no value drop, and a section with no rows drops with them.
// A row whose exact value is already a tile above is dropped, so At a glance
// and the field sections stop repeating each other.
const readSections = (recordData, ids, tiled = {}, root = null) =>
    (Array.isArray(ids) ? ids : [])
        .map((id) => {
            const group = sectionGroups[id]
            if (group == null) return null
            const rows = []
            const paths =
                root == null
                    ? group.fields
                    : group.fields.filter((path) => path.startsWith(`${root}.`))
            paths.forEach((path) => {
                const tile = readTile(recordData, path)
                if (tile == null || tiled[path] === tile.value) return
                rows.push({ label: tile.label, value: tile.value })
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
    const tiled = {}
    ;(profile.tiles || []).forEach((entry) => {
        if (tiles.length >= maxTiles) return
        const tile = readTileEntry(recordData, entry)
        if (tile == null) return
        tiles.push(tile)
        const path = typeof entry === 'string' ? entry : entry.path
        tiled[path] = tile.value
        if (tile.pair != null) tiled[entry.pair] = tile.pair.value
    })

    // Fragments carry no separators of their own, so a dropped fragment can
    // never leave a dangling dash or comma behind.
    const separator = profile.separator != null ? profile.separator : CAPTION_SEPARATOR

    // The author leads the citation and also stands alone on the caption card.
    const citationAuthor = renderFragments(recordData, profile.citationAuthor, ', ')
    const citationBody = renderFragments(recordData, profile.citation, ', ')
    const citation = [citationAuthor, citationBody].filter((part) => part != null).join(', ')

    // General fields are the profile's `gather` sections, closing with the whole
    // `archive` object as its own Archival subsection.
    const gatherSections = readSections(recordData, profile.sections, tiled, 'gather')
    const archiveRows =
        profile.otherFields === false ? [] : readOtherRows(recordData, { roots: ['archive'] })
    const sections = archiveRows.length
        ? [...gatherSections, { id: 'archive', title: 'Archival', rows: archiveRows }]
        : gatherSections

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
        timeline: readTimeline(recordData, profile.timeline),
        priorityTiles: profile.priorityTiles != null ? profile.priorityTiles : tiles.length,
        emptyState: profile.emptyState || 'no_browse_generic',
    }
}
