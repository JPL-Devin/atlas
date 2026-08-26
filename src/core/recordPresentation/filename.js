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
// the ranged fields (sol, clock, site, drive, version).
const describeValue = (segment, value) => {
    const exact = segment.values ? segment.values[value] : null
    if (exact != null) return exact

    const groups = segment.valueGroups || []
    for (let i = 0; i < groups.length; i++)
        if (groups[i].codes.split(/\s+/).indexOf(value) !== -1) return groups[i].meaning

    const patterns = segment.patterns || []
    for (let i = 0; i < patterns.length; i++) {
        const match = value.match(new RegExp(patterns[i].match))
        if (match) return fill(patterns[i].meaning, value, match)
    }
    return null
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
        pieces.push({
            text: value,
            label: segment.label,
            color: segment.color || null,
            description: segment.description || null,
            meaning: describeValue(segment, value),
        })
        cursor = to
    })
    if (cursor === 0) return null
    if (cursor < filename.length) pieces.push({ text: filename.slice(cursor) })

    return { title: spec.title || null, reference: spec.reference || null, pieces }
}

const first = (value) => (Array.isArray(value) ? value[0] : value)

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
