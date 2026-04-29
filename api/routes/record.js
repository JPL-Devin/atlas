'use strict'

const express = require('express')

const elasticsearch = require('../services/elasticsearch')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

/**
 * GET /api/record/:id
 *
 * Fetch a single PDS product document by its Elasticsearch `_id`. The id may
 * include URL-safe characters (e.g. PDS4 LIDVIDs) so it is decoded before use.
 */
router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        const id = decodeURIComponent(req.params.id)

        try {
            const response = await elasticsearch.getDocument(id)
            res.json({
                id: response._id,
                index: response._index,
                version: response._version,
                source: response._source,
            })
        } catch (err) {
            const statusCode = err.statusCode || (err.meta && err.meta.statusCode)
            if (statusCode === 404) {
                res.status(404).json({
                    error: 'NotFound',
                    message: `No record found with id "${id}".`,
                })
                return
            }
            throw err
        }
    })
)

module.exports = router
