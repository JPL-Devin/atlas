// Keyword-typed fields to sort on in place of text-only fields that have no keyword sub-field
export const SORT_FIELD_FALLBACKS = {
    'gather.pds_archive.file_name': 'archive.name',
}

const resolveSortField = (properties, field) => {
    let definition = { properties }
    for (const key of field.split('.')) {
        definition = definition?.properties?.[key]
        if (definition == null) {
            return field
        }
    }
    if (definition.type !== 'text' || definition.fielddata === true) {
        return field
    }
    const subFields = definition.fields || {}
    const keyword = Object.keys(subFields).find((k) => subFields[k].type === 'keyword')
    return keyword != null ? `${field}.${keyword}` : null
}

/**
 * Resolves the index field to sort on for a dotted field path.
 * Text fields sort on their keyword sub-field (or their SORT_FIELD_FALLBACKS field).
 * @param {Object} mapping - raw index mapping ({ mappings: { properties } })
 * @param {string} field
 * @return {string|null} field to sort on, or null if the field can't be sorted
 */
export const getSortField = (mapping, field) => {
    if (field == null) {
        return null
    }
    const properties = mapping?.mappings?.properties
    if (properties == null) {
        return field
    }
    const sortField = resolveSortField(properties, field)
    if (sortField != null || SORT_FIELD_FALLBACKS[field] == null) {
        return sortField
    }
    return resolveSortField(properties, SORT_FIELD_FALLBACKS[field])
}
