import { fields, otherFields as config } from '../../config/recordDetail'
import { formatValue } from './formatters'
import { isValidValue } from './validity'

const includedRoots = new Set(config.includeRoots)
const excludedRoots = new Set(config.excludeRoots)
const excludedSegments = new Set(config.excludeSegments)
const excludedPaths = new Set(config.excludePaths)
const acronyms = new Set(config.acronyms)

// A geo point is one value, not a branch to walk into.
const isLeaf = (value) =>
    value == null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    (value.lat != null && value.lon != null)

// Sentence case, like the catalogued labels; known acronyms stay uppercase.
const label = (segment) =>
    segment
        .split('_')
        .map((word, idx) => {
            if (acronyms.has(word)) return word.toUpperCase()
            return idx === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
        })
        .join(' ')

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/

// Bare lowercase codes read better title-cased; anything else is shown verbatim.
const inferFormat = (value, path = '') => {
    const list = Array.isArray(value) ? value : [value]
    const every = (test) => list.length > 0 && list.every(test)
    if (path.endsWith('size') && every((v) => typeof v === 'number')) return 'bytes'
    if (every((v) => typeof v === 'boolean' || v === 'true' || v === 'false')) return 'boolean'
    if (every((v) => typeof v === 'string' && ISO_DATETIME.test(v))) return 'datetime'
    // Identifiers keep their exact spelling; only short bare codes get title-cased.
    const code = (v) =>
        typeof v === 'string' && /^[a-z][a-z0-9_]*$/.test(v) && v.split('_').length <= 3
    if (!path.endsWith('_id') && every(code)) return 'titlecase'
    // Uncatalogued floats carry no unit, so two decimals is as far as they mean.
    if (every((v) => typeof v === 'number' && !Number.isInteger(v))) return 'number'
    return 'text'
}

// Two leaves can share a last segment (`archive.mission`, `gather.common.mission`),
// so a collision keeps its parent for context.
const disambiguate = (rows) => {
    const counts = {}
    rows.forEach(({ label: text }) => {
        const key = text.toLowerCase()
        counts[key] = (counts[key] || 0) + 1
    })
    return rows.map((row) => {
        if (counts[row.label.toLowerCase()] < 2) return row
        const segments = row.path.split('.')
        if (segments.length < 2) return row
        return { ...row, label: `${row.label} (${label(segments[segments.length - 2])})` }
    })
}

const walk = (node, prefix, out) => {
    if (node == null || typeof node !== 'object' || Array.isArray(node)) return
    Object.keys(node).forEach((key) => {
        const path = prefix === '' ? key : `${prefix}.${key}`
        if (excludedSegments.has(key) || excludedPaths.has(path)) return
        if (prefix === '' && (excludedRoots.has(key) || !includedRoots.has(key))) return
        const value = node[key]
        if (isLeaf(value)) out.push({ path, value })
        else walk(value, path, out)
    })
}

// Every normalized leaf under the included roots that the configured sections
// don't already show, minus the raw label branches.
export const readOtherRows = (recordData, { usedPaths = [] } = {}) => {
    if (recordData == null) return []

    const used = new Set(usedPaths)
    const leaves = []
    walk(recordData, '', leaves)

    const rows = []
    leaves.forEach(({ path, value }) => {
        if (used.has(path) || rows.length >= config.maxRows) return
        const catalogued = fields[path]
        const field = catalogued != null ? catalogued : { format: inferFormat(value, path) }
        if (!isValidValue(value, field)) return
        const formatted = formatValue(value, field)
        if (formatted == null) return
        const text = catalogued != null ? catalogued.label : label(path.split('.').pop())
        rows.push({ label: text, value: formatted, path })
    })

    return disambiguate(rows)
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(({ label: text, value }) => ({ label: text, value }))
}
