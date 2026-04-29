'use strict'

/**
 * Translate REST query parameters into an Elasticsearch DSL body that targets
 * the Atlas index. The field names mirror those exposed at `src/core/constants.js`
 * (see `ES_PATHS`) so the API stays consistent with the existing frontend model.
 */

const FIELD_PATHS = {
    mission: 'gather.common.mission',
    instrument: 'gather.common.instrument',
    spacecraft: 'gather.common.spacecraft',
    target: 'gather.common.target',
    productType: 'gather.common.product_type',
    startTime: 'gather.time.start_time',
    geoLocation: 'gather.common.geo_location',
    productId: 'gather.pds_archive.product_id',
}

function asArray(value) {
    if (value === undefined || value === null) return []
    if (Array.isArray(value)) return value
    return String(value)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
}

function clampInt(value, { min, max, fallback }) {
    const n = Number.parseInt(value, 10)
    if (!Number.isFinite(n)) return fallback
    if (typeof min === 'number' && n < min) return min
    if (typeof max === 'number' && n > max) return max
    return n
}

function buildKeywordQuery(keyword) {
    if (!keyword) return null
    return {
        query_string: {
            query: keyword,
            default_operator: 'AND',
        },
    }
}

function buildTermsFilter(field, values) {
    if (!values || values.length === 0) return null
    if (values.length === 1) {
        return { term: { [field]: values[0] } }
    }
    return { terms: { [field]: values } }
}

function buildBoundingBoxFilter(bbox) {
    if (!bbox) return null
    const parts = String(bbox)
        .split(',')
        .map((p) => Number.parseFloat(p.trim()))
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null
    const [minLon, minLat, maxLon, maxLat] = parts
    return {
        geo_bounding_box: {
            [FIELD_PATHS.geoLocation]: {
                top_left: { lat: maxLat, lon: minLon },
                bottom_right: { lat: minLat, lon: maxLon },
            },
        },
    }
}

function buildDateRangeFilter(startTime, endTime) {
    if (!startTime && !endTime) return null
    const range = {}
    if (startTime) range.gte = startTime
    if (endTime) range.lte = endTime
    return { range: { [FIELD_PATHS.startTime]: range } }
}

/**
 * Build a search DSL body from REST-style query parameters.
 *
 * @param {object} params
 * @param {string} [params.keyword]
 * @param {string|string[]} [params.mission]
 * @param {string|string[]} [params.instrument]
 * @param {string|string[]} [params.target]
 * @param {string|string[]} [params.spacecraft]
 * @param {string|string[]} [params.productType]
 * @param {string} [params.bbox] - "minLon,minLat,maxLon,maxLat".
 * @param {string} [params.startTime] - ISO timestamp.
 * @param {string} [params.endTime] - ISO timestamp.
 * @param {number|string} [params.page]
 * @param {number|string} [params.size]
 * @param {string} [params.sortField]
 * @param {string} [params.sortOrder] - "asc" | "desc".
 * @returns {{ body: object, page: number, size: number }}
 */
function buildSearchBody(params = {}) {
    const page = clampInt(params.page, { min: 1, max: 10_000, fallback: 1 })
    const size = clampInt(params.size, { min: 1, max: 500, fallback: 25 })

    const must = []
    const filter = []

    const keywordQuery = buildKeywordQuery(params.keyword)
    if (keywordQuery) must.push(keywordQuery)

    const filterDefinitions = [
        [FIELD_PATHS.mission, asArray(params.mission)],
        [FIELD_PATHS.instrument, asArray(params.instrument)],
        [FIELD_PATHS.target, asArray(params.target)],
        [FIELD_PATHS.spacecraft, asArray(params.spacecraft)],
        [FIELD_PATHS.productType, asArray(params.productType)],
    ]
    for (const [field, values] of filterDefinitions) {
        const f = buildTermsFilter(field, values)
        if (f) filter.push(f)
    }

    const bboxFilter = buildBoundingBoxFilter(params.bbox)
    if (bboxFilter) filter.push(bboxFilter)

    const dateRange = buildDateRangeFilter(params.startTime, params.endTime)
    if (dateRange) filter.push(dateRange)

    const query =
        must.length === 0 && filter.length === 0
            ? { match_all: {} }
            : { bool: { must, filter } }

    const body = {
        from: (page - 1) * size,
        size,
        track_total_hits: true,
        query,
    }

    if (params.sortField) {
        body.sort = [
            {
                [params.sortField]: { order: params.sortOrder === 'asc' ? 'asc' : 'desc' },
            },
        ]
    }

    return { body, page, size }
}

/**
 * Build an archive-explorer DSL targeted at a single PDS archive level
 * (bundle/collection/product). Mirrors the patterns used by the React app's
 * archive explorer page.
 *
 * @param {object} params
 * @param {string} [params.parentUri] - The parent URI to list children of.
 * @param {string} [params.fsType] - "directory" or "file".
 * @param {number|string} [params.page]
 * @param {number|string} [params.size]
 */
function buildArchiveBody(params = {}) {
    const page = clampInt(params.page, { min: 1, max: 10_000, fallback: 1 })
    const size = clampInt(params.size, { min: 1, max: 1000, fallback: 100 })

    const filter = []
    if (params.parentUri) {
        filter.push({ term: { 'archive.parent_uri': params.parentUri } })
    }
    if (params.fsType) {
        filter.push({ term: { 'archive.fs_type': params.fsType } })
    }

    const body = {
        from: (page - 1) * size,
        size,
        track_total_hits: true,
        query: filter.length === 0 ? { match_all: {} } : { bool: { filter } },
        sort: [{ 'archive.name.keyword': { order: 'asc' } }],
    }

    return { body, page, size }
}

module.exports = {
    FIELD_PATHS,
    buildSearchBody,
    buildArchiveBody,
    asArray,
    clampInt,
}
