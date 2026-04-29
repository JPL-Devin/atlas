'use strict'

/**
 * Wrap an async route handler so that thrown errors are forwarded to Express.
 *
 * @param {Function} fn
 * @returns {Function}
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

module.exports = asyncHandler
