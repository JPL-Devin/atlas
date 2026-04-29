'use strict'

const express = require('express')

const router = express.Router()

/**
 * Static mission/body catalogue. Mirrors the `MISSIONS_TO_BODIES` constant in
 * `src/core/constants.js` so the React frontend can read it from the API
 * instead of bundling it at build time.
 */
const MISSIONS_TO_BODIES = {
    cassini: {
        main: 'Saturn',
        planets: ['saturn'],
        moons: [
            'aegaeon', 'aegir', 'albiorix', 'anthe', 'atlas', 'bebhionn', 'bergelmir',
            'bestla', 'calypso', 'daphnis', 'dione', 'enceladus', 'epimetheus',
            'erriapus', 'farbauti', 'fenrir', 'fornjot', 'greip', 'hati', 'helene',
            'hyperion', 'hyrrokkin', 'iapetus', 'ijiraq', 'janus', 'jarnsaxa', 'kari',
            'kiviuq', 'loge', 'methone', 'mimas', 'mundilfari', 'narvi', 'paaliaq',
            'pallene', 'pan', 'pandora', 'phoebe', 'polydeuces', 'prometheus', 'rhea',
            'siarnaq', 'skathi', 'skoll', 'surtur', 'suttungr', 'tarqeq', 'tarvos',
            'telesto', 'tethys', 'thrymr', 'titan', 'ymir',
        ],
    },
    mars_2020: {
        main: 'Mars',
        planets: ['mars'],
        moons: ['deimos', 'phobos'],
    },
    mro: {
        main: 'Mars',
        planets: ['mars'],
        moons: ['deimos', 'phobos'],
    },
}

const DISPLAY_NAMES = {
    cassini: 'Cassini',
    mars_2020: 'Mars 2020',
    mro: 'MRO - Mars Reconnaissance Orbiter',
}

router.get('/', (req, res) => {
    const missions = Object.entries(MISSIONS_TO_BODIES).map(([key, value]) => ({
        id: key,
        displayName: DISPLAY_NAMES[key] || key,
        ...value,
    }))
    res.json({ missions })
})

router.get('/:id', (req, res) => {
    const mission = MISSIONS_TO_BODIES[req.params.id]
    if (!mission) {
        res.status(404).json({ error: 'NotFound', message: `Unknown mission: ${req.params.id}` })
        return
    }
    res.json({
        id: req.params.id,
        displayName: DISPLAY_NAMES[req.params.id] || req.params.id,
        ...mission,
    })
})

module.exports = router
module.exports.MISSIONS_TO_BODIES = MISSIONS_TO_BODIES
