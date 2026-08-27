import { getIn } from '../utils'
import { filenameSpecs } from '../../config/recordDetail'

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

/** The mission's spec, or the PDS-standard-specific one when both exist. */
export const resolveFilenameSpec = ({ mission, pds_standard } = {}) => {
    if (!mission) return null
    const specific = filenameSpecs[`${mission}.${pds_standard}`]
    return specific != null ? specific : filenameSpecs[mission] || null
}

/**
 * Splits a filename into labelled, decoded pieces for display. Returns null
 * when no spec covers the name, so callers can render it as plain text.
 */
export const parseFilename = (filename, spec) => {
    if (typeof filename !== 'string' || spec == null) return null
    if (spec.match != null && !new RegExp(spec.match).test(filename)) return null

    const pieces = []
    let cursor = 0
    ;(spec.segments || []).forEach((segment) => {
        const from = segment.start - 1
        const to = from + segment.length
        if (from < cursor || to > filename.length) return
        // Characters between segments (the extension dot) carry no meaning.
        if (from > cursor) pieces.push({ text: filename.slice(cursor, from) })
        const value = filename.slice(from, to)
        const described = describeValue(segment, value)
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

    return { title: spec.title || null, reference: spec.reference || null, pieces }
}

const first = (value) => (Array.isArray(value) ? value[0] : value)

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

// Resolves the spec from the record itself, so callers share one gate on
// whether a filename has a breakdown at all.
export const parseRecordFilename = (filename, recordData) =>
    parseFilename(
        filename,
        resolveFilenameSpec({
            mission: first(getIn(recordData, 'gather.common.mission')),
            pds_standard: first(getIn(recordData, 'gather.pds_archive.pds_standard')),
        })
    )
