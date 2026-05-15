import React from 'react'

import { makeStyles } from '@mui/styles'

import { getBannerMessage } from '../../core/runtimeConfig'

const useStyles = makeStyles(() => ({
    messageBanner: {
        width: '100%',
        height: '40px',
        lineHeight: '40px',
        background: 'linear-gradient(to right, #fac4c4ff, #ffebeb, #ffebeb, #fac4c4ff)',
        color: '#700000',
        borderBottom: '1px solid rgba(121, 121, 124, 0.75)',
        fontSize: '17px',
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        fontFamily: 'Helvetica, Arial, Verdana, sans-serif',
    },
}))

const MessageBanner = () => {
    const c = useStyles()
    const message = getBannerMessage()

    if (!message) return null

    return (
        <div className={c.messageBanner} data-testid="message-banner">
            {message}
        </div>
    )
}

export default MessageBanner
