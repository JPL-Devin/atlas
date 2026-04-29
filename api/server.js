'use strict'

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const config = require('./config')
const apiRouter = require('./routes')
const errorHandler = require('./middleware/errorHandler')

function createApp() {
    const app = express()

    app.use(helmet())
    app.use(
        cors({
            origin: config.corsOrigins.length === 0 ? true : config.corsOrigins,
            credentials: true,
        })
    )
    app.use(express.json({ limit: '5mb' }))

    app.get('/health', (req, res) => {
        res.json({ status: 'ok' })
    })

    app.use('/api', apiRouter)

    app.use((req, res) => {
        res.status(404).json({ error: 'NotFound', message: `No route for ${req.method} ${req.path}` })
    })

    app.use(errorHandler)

    return app
}

if (require.main === module) {
    const app = createApp()
    app.listen(config.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Atlas API listening on port ${config.port}`)
    })
}

module.exports = createApp
