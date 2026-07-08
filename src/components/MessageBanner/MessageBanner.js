import React, { useState } from 'react'

import { makeStyles } from '@mui/styles'

import { getBannerMessage } from '../../core/runtimeConfig'

const useStyles = makeStyles(() => ({
    messageBanner: {
        position: 'relative',
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
    dismissButton: {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#700000',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '0 4px',
        lineHeight: 1,
        fontFamily: 'Helvetica, Arial, Verdana, sans-serif',
        '&:hover': {
            opacity: 0.6,
        },
    },
}))

const MessageBanner = () => {
    const c = useStyles()
    const message = getBannerMessage()
    const [dismissed, setDismissed] = useState(false)

    if (!message || dismissed) return null

    return (
        <div className={c.messageBanner} data-testid="message-banner">
            {message}
            <button
                className={c.dismissButton}
                onClick={() => setDismissed(true)}
                aria-label="Dismiss banner"
                data-testid="message-banner-dismiss"
            >
                ✕
            </button>
        </div>
    )
}

export default MessageBanner
