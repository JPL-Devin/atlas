'use strict'

const express = require('express')

const config = require('../config')
const elasticsearch = require('../services/elasticsearch')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

const SUPPORTED_FORMATS = new Set(['curl', 'wget', 'csv', 'txt', 'zip'])

const FORMAT_CONTENT_TYPES = {
    curl: 'text/x-shellscript; charset=utf-8',
    wget: 'text/x-shellscript; charset=utf-8',
    csv: 'text/csv; charset=utf-8',
    txt: 'text/plain; charset=utf-8',
    zip: 'application/zip',
}

const FORMAT_EXTENSIONS = {
    curl: 'sh',
    wget: 'sh',
    csv: 'csv',
    txt: 'txt',
    zip: 'zip',
}

function buildCurlScript(records) {
    const lines = ['#!/usr/bin/env bash', 'set -euo pipefail', '']
    for (const record of records) {
        const uri = record.uri
        if (!uri) continue
        const fileName = record.fileName || ''
        if (fileName) {
            lines.push(`curl -L -o ${JSON.stringify(fileName)} ${JSON.stringify(uri)}`)
        } else {
            lines.push(`curl -L -O ${JSON.stringify(uri)}`)
        }
    }
    return `${lines.join('\n')}\n`
}

function buildWgetScript(records) {
    const lines = ['#!/usr/bin/env bash', 'set -euo pipefail', '']
    for (const record of records) {
        const uri = record.uri
        if (!uri) continue
        const fileName = record.fileName || ''
        if (fileName) {
            lines.push(`wget -O ${JSON.stringify(fileName)} ${JSON.stringify(uri)}`)
        } else {
            lines.push(`wget ${JSON.stringify(uri)}`)
        }
    }
    return `${lines.join('\n')}\n`
}

function buildTxtList(records) {
    return `${records.map((r) => r.uri).filter(Boolean).join('\n')}\n`
}

function escapeCsvCell(value) {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

function buildCsv(records) {
    const header = ['id', 'mission', 'instrument', 'target', 'product_id', 'start_time', 'uri']
    const rows = [header.join(',')]
    for (const record of records) {
        rows.push(
            [
                record.id,
                record.mission,
                record.instrument,
                record.target,
                record.productId,
                record.startTime,
                record.uri,
            ]
                .map(escapeCsvCell)
                .join(',')
        )
    }
    return `${rows.join('\n')}\n`
}

function flattenRecord(hit) {
    const source = hit._source || {}
    const gather = source.gather || {}
    const common = gather.common || {}
    const time = gather.time || {}
    const archive = source.archive || {}
    const pds = gather.pds_archive || {}

    return {
        id: hit._id,
        uri: source.uri || (gather.uri && gather.uri) || '',
        fileName: archive.name || pds.file_name || '',
        mission: common.mission,
        instrument: common.instrument,
        target: common.target,
        productId: pds.product_id,
        startTime: time.start_time,
    }
}

// Stay under Elasticsearch's default `index.max_result_window` (10_000) so the
// cart endpoint keeps working even when MAX_BULK_DOWNLOAD_COUNT is configured
// higher than that.
const ES_LOOKUP_CHUNK_SIZE = 10_000

async function fetchRecordsByIds(ids) {
    const records = []
    for (let i = 0; i < ids.length; i += ES_LOOKUP_CHUNK_SIZE) {
        const chunk = ids.slice(i, i + ES_LOOKUP_CHUNK_SIZE)
        const body = {
            size: chunk.length,
            track_total_hits: false,
            query: { ids: { values: chunk } },
        }
        const response = await elasticsearch.search(body)
        const hits = (response.hits && response.hits.hits) || []
        for (const hit of hits) records.push(flattenRecord(hit))
    }
    return records
}

/**
 * POST /api/cart/download
 *
 * Accepts a JSON body of:
 *   {
 *     "ids": ["...", "..."],
 *     "format": "curl" | "wget" | "csv" | "txt" | "zip",
 *     "filename": "atlas-cart"   // optional, sans extension
 *   }
 *
 * Returns the appropriate downloadable artifact for the cart contents. The
 * `zip` format streams a manifest plus the per-format scripts so that the
 * frontend can offer a one-click bundle without re-querying Elasticsearch.
 */
router.post(
    '/download',
    asyncHandler(async (req, res) => {
        const body = req.body || {}
        const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
        const format = String(body.format || '').toLowerCase()
        const requestedName = String(body.filename || 'atlas-cart').replace(/[^a-zA-Z0-9_.-]/g, '_')

        if (ids.length === 0) {
            res.status(400).json({ error: 'BadRequest', message: 'At least one product id is required.' })
            return
        }
        if (ids.length > config.maxBulkDownloadCount) {
            res.status(400).json({
                error: 'BadRequest',
                message: `Cart exceeds the maximum of ${config.maxBulkDownloadCount} products.`,
            })
            return
        }
        if (!SUPPORTED_FORMATS.has(format)) {
            res.status(400).json({
                error: 'BadRequest',
                message: `Unsupported format "${format}". Supported: ${[...SUPPORTED_FORMATS].join(', ')}.`,
            })
            return
        }

        const records = await fetchRecordsByIds(ids)

        if (records.length === 0) {
            res.status(404).json({ error: 'NotFound', message: 'No matching products were found.' })
            return
        }

        const extension = FORMAT_EXTENSIONS[format]
        const filename = `${requestedName}.${extension}`
        res.setHeader('Content-Type', FORMAT_CONTENT_TYPES[format])
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

        switch (format) {
            case 'curl':
                res.send(buildCurlScript(records))
                return
            case 'wget':
                res.send(buildWgetScript(records))
                return
            case 'txt':
                res.send(buildTxtList(records))
                return
            case 'csv':
                res.send(buildCsv(records))
                return
            case 'zip':
                // The actual binary streaming of remote PDS files is handled in the
                // browser via StreamSaver in the existing frontend. Here we return
                // a JSON manifest the client can use to drive that streaming flow.
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename="${requestedName}.manifest.json"`
                )
                res.send(JSON.stringify({ records }, null, 2))
                return
            default:
                res.status(500).json({ error: 'InternalServerError', message: 'Unhandled format.' })
        }
    })
)

module.exports = router
