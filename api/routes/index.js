'use strict'

const express = require('express')

const search = require('./search')
const record = require('./record')
const missions = require('./missions')
const archive = require('./archive')
const cart = require('./cart')

const router = express.Router()

router.get('/', (req, res) => {
    res.json({
        name: 'Atlas IV API',
        version: '1.0.0',
        endpoints: [
            'GET    /api/search',
            'POST   /api/search',
            'POST   /api/search/scroll',
            'GET    /api/record/:id',
            'GET    /api/missions',
            'GET    /api/missions/:id',
            'GET    /api/archive',
            'POST   /api/cart/download',
        ],
    })
})

router.use('/search', search)
router.use('/record', record)
router.use('/missions', missions)
router.use('/archive', archive)
router.use('/cart', cart)

module.exports = router
