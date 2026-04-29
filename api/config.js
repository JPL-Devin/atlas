'use strict'

require('dotenv').config()

function parseList(value) {
    if (!value) return []
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

function parseBool(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback
    return /^(1|true|yes|on)$/i.test(String(value))
}

function parseInteger(value, fallback) {
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) ? n : fallback
}

const config = {
    port: parseInteger(process.env.PORT, 3001),
    corsOrigins: parseList(process.env.CORS_ORIGIN || 'http://localhost:3000'),
    elasticsearch: {
        url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        index: process.env.ELASTICSEARCH_INDEX || 'atlas',
        username: process.env.ELASTICSEARCH_USERNAME || '',
        password: process.env.ELASTICSEARCH_PASSWORD || '',
        apiKey: process.env.ELASTICSEARCH_API_KEY || '',
        tlsRejectUnauthorized: parseBool(process.env.ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED, true),
    },
    maxBulkDownloadCount: parseInteger(process.env.MAX_BULK_DOWNLOAD_COUNT, 25000),
}

module.exports = config
