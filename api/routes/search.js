'use strict'

const express = require('express')

const elasticsearch = require('../services/elasticsearch')
const { buildSearchBody, clampInt } = require('../services/queryBuilder')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

/**
 * GET /api/search
 *
 * Translate REST query parameters into an Elasticsearch search against the
 * Atlas index. Returns paginated hits along with the total count.
 *
 * Supported query parameters:
 *   - keyword: free-text query string.
 *   - mission, instrument, target, spacecraft, productType: comma-separated
 *     or repeated terms filters.
 *   - bbox: "minLon,minLat,maxLon,maxLat" geo bounding box.
 *   - startTime, endTime: ISO timestamps for a range filter on
 *     gather.time.start_time.
 *   - page (default 1), size (default 25, max 500).
 *   - sortField, sortOrder ("asc"|"desc").
 */
router.get(
    '/',
    asyncHandler(async (req, res) => {
        const { body, page, size } = buildSearchBody(req.query)
        const response = await elasticsearch.search(body)

        const hits = response.hits || {}
        const total =
            (hits.total && (hits.total.value !== undefined ? hits.total.value : hits.total)) || 0

        res.json({
            page,
            size,
            total,
            results: (hits.hits || []).map((hit) => ({
                id: hit._id,
                score: hit._score,
                source: hit._source,
            })),
        })
    })
)

/**
 * POST /api/search
 *
 * Accept a raw Elasticsearch DSL body for advanced clients that need to issue
 * full DSL queries (this preserves backward compatibility with the existing
 * frontend's DSL builder while we migrate to the typed REST endpoints).
 */
router.post(
    '/',
    asyncHandler(async (req, res) => {
        const dsl = req.body || {}
        const filterPath = req.query.filter_path || undefined
        const response = await elasticsearch.search(dsl, { filterPath })
        res.json(response)
    })
)

/**
 * POST /api/search/scroll
 *
 * Drive Elasticsearch scroll-based pagination. The request body accepts one of:
 *   - { dsl: <elasticsearch DSL>, scroll: "1m" }
 *       Initialise a new scroll and return the first page.
 *   - { scroll_id: "...", scroll: "1m" }
 *       Continue an existing scroll.
 *   - { clear_scroll_id: "..." or [ ... ] }
 *       Clear an existing scroll context.
 *
 * For PIT-based pagination, the request body accepts:
 *   - { open_pit: true, keep_alive: "1m" }
 *   - { close_pit_id: "..." }
 */
router.post(
    '/scroll',
    asyncHandler(async (req, res) => {
        const body = req.body || {}

        if (body.clear_scroll_id) {
            const result = await elasticsearch.clearScroll(body.clear_scroll_id)
            res.json(result)
            return
        }

        if (body.open_pit) {
            const result = await elasticsearch.openPointInTime(body.keep_alive || '1m')
            res.json(result)
            return
        }

        if (body.close_pit_id) {
            const result = await elasticsearch.closePointInTime(body.close_pit_id)
            res.json(result)
            return
        }

        if (body.scroll_id) {
            const result = await elasticsearch.scroll(body.scroll_id, body.scroll || '1m')
            res.json(result)
            return
        }

        if (body.dsl) {
            const size = clampInt(body.dsl.size, { min: 1, max: 1000, fallback: 100 })
            const dslWithScrollSettings = { ...body.dsl, size }
            const client = elasticsearch.getClient()
            const response = await client.search({
                index: undefined,
                scroll: body.scroll || '1m',
                body: dslWithScrollSettings,
            })
            res.json(response.body || response)
            return
        }

        res.status(400).json({
            error: 'BadRequest',
            message:
                'Provide one of: dsl (initialise scroll), scroll_id (continue), clear_scroll_id, open_pit, or close_pit_id.',
        })
    })
)

module.exports = router
