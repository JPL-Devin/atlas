import moment from 'moment'

import { prettify } from '../utils'

const asNumber = (value) => (typeof value === 'number' ? value : Number(String(value).trim()))

const formatters = {
    text: (value) => String(value),
    uppercase: (value) => String(value).toUpperCase(),
    titlecase: (value) => prettify(String(value)),
    vocabulary: (value) => prettify(String(value)),
    integer: (value) => {
        const n = asNumber(value)
        return Number.isNaN(n) ? String(value) : String(Math.round(n))
    },
    number: (value, field) => {
        const n = asNumber(value)
        if (Number.isNaN(n)) return String(value)
        const precision = field.precision != null ? field.precision : 2
        return n.toFixed(precision)
    },
    datetime: (value) => {
        const m = moment.utc(String(value))
        return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss[Z]') : String(value)
    },
    clock: (value) => {
        const str = String(value)
        const match = str.match(/(\d{1,2}:\d{2}(:\d{2})?)/)
        return match ? match[1] : str
    },
    bytes: (value) => {
        const n = asNumber(value)
        if (Number.isNaN(n)) return String(value)
        const units = ['B', 'KB', 'MB', 'GB', 'TB']
        let size = n
        let unit = 0
        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024
            unit++
        }
        return `${unit === 0 ? size : size.toFixed(1)} ${units[unit]}`
    },
    // Elasticsearch geo_point, either as [lon, lat] or as { lat, lon }.
    geo: (value) => {
        if (Array.isArray(value) && value.length === 2) {
            const lon = asNumber(value[0])
            const lat = asNumber(value[1])
            if (Number.isNaN(lon) || Number.isNaN(lat)) return null
            return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
        }
        if (value && value.lat != null && value.lon != null)
            return `${asNumber(value.lat).toFixed(2)}, ${asNumber(value.lon).toFixed(2)}`
        if (typeof value === 'string') return value
        return null
    },
}

export const FORMATTER_NAMES = Object.keys(formatters)

/** Formats one valid value for display, appending the field's unit if any. */
export const formatValue = (value, field) => {
    const formatter = formatters[field.format] || formatters.text
    // A geo point is one value spread over two array elements.
    const list = Array.isArray(value) && field.format !== 'geo' ? value : [value]
    const formatted = list
        .map((v) => formatter(v, field))
        .filter((v) => v != null && v !== '')
        .join(', ')
    if (formatted === '') return null
    return field.unit ? `${formatted}${field.unit === '\u00b0' ? '' : ' '}${field.unit}` : formatted
}
