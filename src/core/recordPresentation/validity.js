import { validity } from '../../config/recordDetail'

const rejectedValues = new Set(validity.reject.values.map((v) => v.toUpperCase()))

/**
 * Whether a raw indexed value may be shown, per the global reject rules plus
 * an optional per-field numeric range from the field catalog.
 */
export const isValidValue = (value, field) => {
    if (value == null) return false
    if (Array.isArray(value)) return value.some((v) => isValidValue(v, field))

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed === '') return false
        if (rejectedValues.has(trimmed.toUpperCase())) return false
        const asNumber = Number(trimmed)
        if (trimmed !== '' && !Number.isNaN(asNumber)) return isValidValue(asNumber, field)
        return true
    }

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return false
        if (Math.abs(value) >= validity.reject.sentinelMagnitude) return false
        const range = field != null ? field.valid : null
        if (range) {
            if (range.min != null && value < range.min) return false
            if (range.max != null && value > range.max) return false
        }
        return true
    }

    if (typeof value === 'boolean') return true
    if (typeof value === 'object') return Object.keys(value).length > 0

    return true
}
