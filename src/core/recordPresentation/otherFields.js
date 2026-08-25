import { fields, otherFields as config } from '../../config/recordDetail'
import { getIn } from '../utils'
import { formatValue } from './formatters'
import { isValidValue } from './validity'

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
const inferFormat = (value) => {
    const list = Array.isArray(value) ? value : [value]
    const every = (test) => list.length > 0 && list.every(test)
    if (every((v) => typeof v === 'boolean' || v === 'true' || v === 'false')) return 'boolean'
    if (every((v) => typeof v === 'string' && ISO_DATETIME.test(v))) return 'datetime'
    if (every((v) => typeof v === 'string' && /^[a-z][a-z_]*$/.test(v))) return 'titlecase'
    // Uncatalogued floats carry no unit, so two decimals is as far as they mean.
    if (every((v) => typeof v === 'number' && !Number.isInteger(v))) return 'number'
    return 'text'
}

const rawText = (raw) => (Array.isArray(raw) ? raw.join('|') : String(raw))

const dedupeKey = (path, raw) => `${path.split('.').pop()}=${rawText(raw)}`

// A distinctive value shown once is the same fact under any other name; short
// ones (codes, small integers) legitimately repeat.
const valueKey = (raw) => {
    const text = rawText(raw)
    return text.length >= 6 ? `=${text.toLowerCase()}` : null
}

const walk = (node, prefix, out) => {
    if (node == null || typeof node !== 'object' || Array.isArray(node)) return
    Object.keys(node).forEach((key) => {
        const path = prefix === '' ? key : `${prefix}.${key}`
        if (excludedSegments.has(key) || excludedPaths.has(path)) return
        if (prefix === '' && excludedRoots.has(key)) return
        const value = node[key]
        if (isLeaf(value)) out.push({ path, value })
        else walk(value, path, out)
    })
}

// Every normalized leaf the configured sections don't already show, minus the raw
// label branches, plumbing paths, and values restated under a same-named path.
export const readOtherRows = (recordData, { usedPaths = [], usedLabels = [] } = {}) => {
    if (recordData == null) return []

    const seen = new Set()
    usedPaths.forEach((path) => {
        const raw = getIn(recordData, path)
        if (raw == null) return
        seen.add(dedupeKey(path, raw))
        const byValue = valueKey(raw)
        if (byValue != null) seen.add(byValue)
    })
    const used = new Set(usedPaths)
    // A second row under a label already shown reads as a contradiction, not
    // as extra metadata.
    const labels = new Set(usedLabels.map((text) => text.toLowerCase()))

    const leaves = []
    walk(recordData, '', leaves)

    const rows = []
    leaves.forEach(({ path, value }) => {
        if (used.has(path) || rows.length >= config.maxRows) return
        const catalogued = fields[path]
        const field = catalogued != null ? catalogued : { format: inferFormat(value) }
        if (!isValidValue(value, field)) return
        const key = dedupeKey(path, value)
        const byValue = valueKey(value)
        if (seen.has(key) || (byValue != null && seen.has(byValue))) return
        const formatted = formatValue(value, field)
        if (formatted == null) return
        const text = catalogued != null ? catalogued.label : label(path.split('.').pop())
        if (labels.has(text.toLowerCase())) return
        seen.add(key)
        if (byValue != null) seen.add(byValue)
        labels.add(text.toLowerCase())
        rows.push({ label: text, value: formatted })
    })

    return rows.sort((a, b) => a.label.localeCompare(b.label))
}
