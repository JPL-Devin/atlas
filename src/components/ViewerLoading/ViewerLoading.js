import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import { makeStyles } from '@mui/styles'

import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'

const useStyles = makeStyles((theme) => ({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: 1,
        transition: 'opacity 0.4s ease-out',
    },
    hidden: {
        opacity: 0,
    },
    paper: {
        'background': theme.palette.accent.main,
        'pointerEvents': 'none',
        '& > div': {
            padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
            display: 'flex',
            alignItems: 'center',
        },
    },
    progress: {
        'marginTop': '1px',
        'marginRight': theme.spacing(2),
        '& .MuiCircularProgress-colorPrimary': {
            color: theme.palette.text.secondary,
        },
    },
    text: {
        color: theme.palette.text.secondary,
        fontSize: '14px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textAlign: 'center',
    },
}))

// Shared so a pending record and a pending image look identical.
const ViewerLoading = ({ hidden, label }) => {
    const c = useStyles()

    return (
        <div className={clsx(c.wrapper, { [c.hidden]: hidden })} aria-label={label}>
            <Paper className={c.paper} elevation={2}>
                <div>
                    <div className={c.progress}>
                        <CircularProgress size={20} />
                    </div>
                    <div className={c.text}>LOADING</div>
                </div>
            </Paper>
        </div>
    )
}

ViewerLoading.propTypes = {
    hidden: PropTypes.bool,
    label: PropTypes.string,
}

export default ViewerLoading
