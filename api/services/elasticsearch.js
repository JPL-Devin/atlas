'use strict'

const { Client } = require('@elastic/elasticsearch')

const config = require('../config')

let cachedClient = null

function buildClient() {
    const { url, username, password, apiKey, tlsRejectUnauthorized } = config.elasticsearch

    const clientOptions = {
        node: url,
        tls: {
            rejectUnauthorized: tlsRejectUnauthorized,
        },
    }

    if (apiKey) {
        clientOptions.auth = { apiKey }
    } else if (username && password) {
        clientOptions.auth = { username, password }
    }

    return new Client(clientOptions)
}

function getClient() {
    if (!cachedClient) {
        cachedClient = buildClient()
    }
    return cachedClient
}

/**
 * Run a search against the configured Atlas index using a raw Elasticsearch DSL body.
 *
 * @param {object} body - Elasticsearch query DSL.
 * @param {object} [options]
 * @param {string} [options.index] - Override the default index.
 * @param {string} [options.filterPath] - Comma-separated filter_path string.
 * @param {string} [options.scroll] - When set, initialise a scroll context with this keep-alive (e.g. "1m").
 * @returns {Promise<object>} The raw Elasticsearch response body.
 */
async function search(body, options = {}) {
    const client = getClient()
    const params = {
        index: options.index || config.elasticsearch.index,
        body,
    }
    if (options.filterPath) {
        params.filter_path = options.filterPath
    }
    if (options.scroll) {
        params.scroll = options.scroll
    }
    const response = await client.search(params)
    return response.body || response
}

/**
 * Fetch a single document by its `_id` from the configured Atlas index.
 *
 * @param {string} id
 * @param {object} [options]
 * @param {string} [options.index]
 * @returns {Promise<object>}
 */
async function getDocument(id, options = {}) {
    const client = getClient()
    const response = await client.get({
        index: options.index || config.elasticsearch.index,
        id,
    })
    return response.body || response
}

/**
 * Open a Point-In-Time (PIT) for stable pagination across snapshots.
 *
 * @param {string} keepAlive - Duration string such as "1m" or "5m".
 * @returns {Promise<{ id: string }>}
 */
async function openPointInTime(keepAlive = '1m') {
    const client = getClient()
    const response = await client.openPointInTime({
        index: config.elasticsearch.index,
        keep_alive: keepAlive,
    })
    return response.body || response
}

/**
 * Close a previously opened PIT.
 *
 * @param {string} pitId
 */
async function closePointInTime(pitId) {
    const client = getClient()
    const response = await client.closePointInTime({ body: { id: pitId } })
    return response.body || response
}

/**
 * Continue a scroll-based pagination request.
 *
 * @param {string} scrollId
 * @param {string} keepAlive
 */
async function scroll(scrollId, keepAlive = '1m') {
    const client = getClient()
    const response = await client.scroll({
        scroll_id: scrollId,
        scroll: keepAlive,
    })
    return response.body || response
}

/**
 * Clear one or more scroll contexts.
 *
 * @param {string|string[]} scrollIds
 */
async function clearScroll(scrollIds) {
    const client = getClient()
    const ids = Array.isArray(scrollIds) ? scrollIds : [scrollIds]
    const response = await client.clearScroll({ body: { scroll_id: ids } })
    return response.body || response
}

module.exports = {
    getClient,
    search,
    getDocument,
    openPointInTime,
    closePointInTime,
    scroll,
    clearScroll,
}
