'use strict'

/* eslint-disable no-unused-vars */

/**
 * Express error-handling middleware. Translates Elasticsearch client errors
 * (which include `meta` and `statusCode` fields) into JSON error responses.
 */
function errorHandler(err, req, res, next) {
    const statusCode =
        err.statusCode ||
        err.status ||
        (err.meta && err.meta.statusCode) ||
        500

    const payload = {
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred.',
    }

    if (err.details) payload.details = err.details

    if (process.env.NODE_ENV !== 'production' && err.stack) {
        payload.stack = err.stack
    }

    res.status(statusCode).json(payload)
}

module.exports = errorHandler
