import { getIn } from '../utils'
import { filenameLoaders } from '../../config/filenames'

const CAPTURE = /\{(number|value|[1-9])\}/g

const fill = (template, value, match) =>
    template.replace(CAPTURE, (token, key) => {
        if (key === 'value') return value
        if (key === 'number') {
            const n = Number(value)
            return Number.isNaN(n) ? value : String(n)
        }
        return match && match[Number(key)] != null ? match[Number(key)] : ''
    })

// A segment's meaning comes from an exact code lookup, then the code groups
// (whole families sharing one meaning), then the ordered patterns, which cover
// the ranged fields (sol, clock, site, drive, version). An exact entry may be a
// bare meaning or a { meaning, description } pair carrying its own long form.
const describeValue = (segment, value) => {
    const exact = segment.values ? segment.values[value] : null
    if (typeof exact === 'string') return { meaning: exact }
    if (exact != null) return { meaning: exact.meaning, description: exact.description }

    const groups = segment.valueGroups || []
    for (let i = 0; i < groups.length; i++)
        if (groups[i].codes.split(/\s+/).indexOf(value) !== -1)
            return { meaning: groups[i].meaning }

    const patterns = segment.patterns || []
    for (let i = 0; i < patterns.length; i++) {
        const match = value.match(new RegExp(patterns[i].match))
        if (match) return { meaning: fill(patterns[i].meaning, value, match) }
    }
    return {}
}

// Grammars loaded so far, filled by loadFilenameSpec.
const loaded = {}

const keysFor = (mission, pds_standard) =>
    [`${mission}.${pds_standard}`, `${mission}`].filter((key) => filenameLoaders[key] != null)

/**
 * The mission's spec, or the PDS-standard-specific one when both exist. A
 * mission whose products follow several conventions registers them as a list.
 * Null until the grammar has been loaded, so callers must await loadFilenameSpec.
 */
export const resolveFilenameSpec = ({ mission, pds_standard } = {}) => {
    if (!mission) return null
    const specific = loaded[`${mission}.${pds_standard}`]
    return specific != null ? specific : loaded[mission] || null
}

// Registers grammars without fetching their chunks, for tests and tooling.
export const primeFilenameSpecs = (specs) => Object.assign(loaded, specs)

// Fetches the record's grammar chunk, then resolves its spec.
export const loadFilenameSpec = async ({ mission, pds_standard } = {}) => {
    if (!mission) return null
    await Promise.all(
        keysFor(mission, pds_standard)
            .filter((key) => loaded[key] === undefined)
            .map(async (key) => {
                const spec = await filenameLoaders[key]()
                loaded[key] = spec.default || spec
            })
    )
    return resolveFilenameSpec({ mission, pds_standard })
}

const parseOne = (filename, spec) => {
    const flags = spec.ignoreCase ? 'i' : ''
    const match = spec.match != null ? filename.match(new RegExp(spec.match, flags)) : null
    if (spec.match != null && match == null) return null

    const pieces = []
    let cursor = 0
    ;(spec.segments || []).forEach((segment) => {
        // Variable-length conventions locate their fields by capture group
        // instead of by character position.
        const captured = segment.group != null ? match[segment.group] : null
        if (segment.group != null && !captured) return
        const from = captured != null ? filename.indexOf(captured, cursor) : segment.start - 1
        const to = from + (captured != null ? captured.length : segment.length)
        if (from < 0) return
        if (from < cursor || to > filename.length) return
        // Characters between segments (the extension dot) carry no meaning.
        if (from > cursor) pieces.push({ text: filename.slice(cursor, from) })
        const value = filename.slice(from, to)
        const described = describeValue(segment, spec.ignoreCase ? value.toUpperCase() : value)
        pieces.push({
            text: value,
            label: segment.label,
            color: segment.color || null,
            description: described.description || segment.description || null,
            meaning: described.meaning || null,
        })
        cursor = to
    })
    if (cursor === 0) return null
    if (cursor < filename.length) pieces.push({ text: filename.slice(cursor) })

    return {
        title: spec.title || null,
        reference: spec.reference || null,
        sis: spec.sis || null,
        pieces,
    }
}

/**
 * Splits a filename into labelled, decoded pieces for display, using the first
 * of the mission's conventions that covers it. Returns null when none does, so
 * callers can render the name as plain text.
 */
export const parseFilename = (filename, spec) => {
    if (typeof filename !== 'string' || spec == null) return null
    const variants = Array.isArray(spec) ? spec : [spec]
    for (let i = 0; i < variants.length; i++) {
        const parsed = parseOne(filename, variants[i])
        if (parsed != null) return parsed
    }
    return null
}

const PRODUCT_TYPE = 'product type'

// The product type code the filename carries, with the mission's own wording
// for it, so chips and tiles showing that code can explain themselves.
export const readProductType = (parsed) => {
    const piece = (parsed?.pieces || []).find(
        (part) => String(part.label).toLowerCase() === PRODUCT_TYPE
    )
    const meaning = piece?.meaning || piece?.description
    if (piece == null || meaning == null) return null
    return { code: piece.text, color: piece.color, meaning }
}

const first = (value) => (Array.isArray(value) ? value[0] : value)

// The mission and standard that pick a record's grammar.
export const readFilenameKey = (recordData) => ({
    mission: first(getIn(recordData, 'gather.common.mission')),
    pds_standard: first(getIn(recordData, 'gather.pds_archive.pds_standard')),
})

// Resolves the spec from the record itself, so callers share one gate on
// whether a filename has a breakdown at all.
export const parseRecordFilename = (filename, recordData) =>
    parseFilename(filename, resolveFilenameSpec(readFilenameKey(recordData)))
