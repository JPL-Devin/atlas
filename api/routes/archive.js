'use strict'

const express = require('express')

const elasticsearch = require('../services/elasticsearch')
const { buildArchiveBody } = require('../services/queryBuilder')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

/**
 * GET /api/archive
 *
 * List archive entries that are direct children of the given parent URI. This
 * powers the multi-column FileX archive explorer in the React frontend.
 *
 * Query parameters:
 *   - parentUri: the bundle/collection URI to list children of. Omit to list
 *     top-level archive entries.
 *   - fsType: filter by "directory" or "file".
 *   - page (default 1), size (default 100, max 1000).
 */
router.get(
    '/',
    asyncHandler(async (req, res) => {
        const { body, page, size } = buildArchiveBody(req.query)
        const response = await elasticsearch.search(body)

        const hits = response.hits || {}
        const total =
            (hits.total && (hits.total.value !== undefined ? hits.total.value : hits.total)) || 0

        res.json({
            page,
            size,
            total,
            parentUri: req.query.parentUri || null,
            entries: (hits.hits || []).map((hit) => ({
                id: hit._id,
                source: hit._source,
            })),
        })
    })
)

module.exports = router
