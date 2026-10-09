import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import clsx from 'clsx'

import { setFieldState } from '../../../../../../core/redux/actions/actions'

import { getIn, capitalize, prettify, isObject, objectToString } from '../../../../../../core/utils'
import { resultsStatuses } from '../../../../../../core/constants'

import { makeStyles } from '@mui/styles'

import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Fade from '@mui/material/Fade'
import Tooltip from '@mui/material/Tooltip'

import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const useStyles = makeStyles((theme) => ({
    ResultsStatus: {
        'position': 'absolute',
        'top': 0,
        'width': '100%',
        'height': '100%',
        'transition': 'all 0.2s ease-out',
        '& > div': {
            transition: 'background 0.4s ease-out',
        },
        '& > div > div': {
            transition: 'background 0.4s ease-out',
        },
    },
    hidden: {
        pointerEvents: 'none',
        opacity: 0,
    },
    paper: {
        'position': 'absolute',
        'top': '50%',
        'left': '50%',
        'transform': 'translateX(-50%) translateY(-50%)',
        'background': theme.palette.primary.main,
        '& > div': {
            padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
        },
    },
    waiting: {
        background: theme.palette.swatches.grey.grey100,
        fontSize: '16px',
        paddingBottom: theme.spacing(0.5),
    },
    waitingTitle: {
        'display': 'flex',
        'justifyContent': 'center',
        'fontSize': '16px',
        'fontWeight': 'bold',
        'marginBottom': theme.spacing(1.5),
        '& > div': {
            marginLeft: theme.spacing(1.5),
        },
    },
    waitingMessage: {
        textAlign: 'center',
        margin: '0px 5%',
        maxWidth: '340px',
    },
    searching: {
        background: theme.palette.accent.main,
        fontSize: '16px',
        color: theme.palette.text.secondary,
        paddingBottom: theme.spacing(0.5),
    },
    searchingProgress: {
        'display': 'flex',
        'justifyContent': 'center',
        'marginTop': theme.spacing(1),
        'marginBottom': theme.spacing(4),
        '& .MuiCircularProgress-colorPrimary': {
            color: theme.palette.text.secondary,
        },
    },
    searchingMessage: {
        fontWeight: 'bold',
        fontSize: '16px',
        textTransform: 'uppercase',
    },
    loadingMore: {
        'position': 'absolute',
        'right': theme.spacing(3),
        'width': '40px',
        'height': '40px',
        'display': 'flex',
        'alignItems': 'center',
        'justifyContent': 'center',
        'borderRadius': '6px',
        'background': theme.palette.accent.main,
        'boxShadow': theme.shadows[2],
        'pointerEvents': 'none',
        '& .MuiCircularProgress-colorPrimary': {
            color: theme.palette.text.secondary,
        },
    },
    loadingMoreTop: {
        top: theme.spacing(1.5),
    },
    loadingMoreBottom: {
        bottom: theme.spacing(1.5),
    },
    none: {
        background: theme.palette.swatches.yellow.yellow700,
        fontSize: '16px',
        paddingBottom: theme.spacing(0.5),
    },
    noneTitle: {
        'display': 'flex',
        'justifyContent': 'center',
        'fontSize': '24px',
        'fontWeight': 'bold',
        'marginBottom': theme.spacing(1.5),
        '& > div': {
            marginLeft: theme.spacing(1.5),
        },
    },
    noneMessage: {
        textAlign: 'center',
        margin: '0px 5%',
        maxWidth: '500px',
    },
    error: {
        background: theme.palette.swatches.red.red500,
        fontSize: '16px',
        color: theme.palette.text.primary,
        paddingBottom: theme.spacing(0.5),
    },
    errorTitle: {
        'display': 'flex',
        'justifyContent': 'center',
        'fontSize': '24px',
        'fontWeight': 'bold',
        'marginBottom': theme.spacing(1.5),
        '& > div': {
            marginLeft: theme.spacing(1.5),
        },
    },
    errorMessage: {
        textAlign: 'center',
        margin: '0px 5%',
        maxWidth: '600px',
    },
}))

const LOADING_MORE_DELAY_MS = 1500

const ResultsStatus = (props) => {
    const c = useStyles()
    const dispatch = useDispatch()

    const resultsStatus = useSelector((state) => {
        return state.getIn(['resultsStatus'])
    }).toJS()

    let inner = null
    let isLoadingMore = false
    let isHidden = false

    switch (resultsStatus.status) {
        case resultsStatuses.WAITING:
            inner = (
                <div className={c.waiting}>
                    <div className={c.waitingTitle}>
                        <ArrowBackIcon />
                        <div>Search for Imagery</div>
                    </div>
                    <div className={c.waitingMessage}>
                        To begin, narrow your query down using the filters provided on the left.
                    </div>
                </div>
            )
            break
        case resultsStatuses.SEARCHING:
            inner = (
                <div className={c.searching}>
                    <div className={c.searchingProgress}>
                        <CircularProgress size={36} />
                    </div>
                    <div className={c.searchingMessage}>Searching</div>
                </div>
            )
            break
        case resultsStatuses.LOADING:
            // Next page: a small box at the scroll edge being loaded, instead of the overlay
            isHidden = true
            isLoadingMore = true
            break
        case resultsStatuses.NONE:
            inner = (
                <div className={c.none}>
                    <div className={c.noneTitle}>
                        <ReportProblemOutlinedIcon fontSize="large" />
                        <div>No Records Found</div>
                    </div>
                    <div className={c.noneMessage}>
                        If you were expecting to see some records, review your query or remove
                        filters to broaden the search.
                    </div>
                </div>
            )
            break
        case resultsStatuses.SUCCESSFUL:
            isHidden = true
            break
        case resultsStatuses.ERROR:
            inner = (
                <div className={c.error}>
                    <div className={c.errorTitle}>
                        <Tooltip title={resultsStatus.message?.error} arrow placement="left-end">
                            <ErrorOutlineOutlinedIcon fontSize="large" />
                        </Tooltip>
                        <div>Search Error</div>
                    </div>
                    <div className={c.errorMessage}>
                        We encountered an error while trying to search our imaging archive, please
                        try again. If the issue persists, please contact a site administrator.
                    </div>
                </div>
            )
            break
        default:
            break
    }

    // Kept after loading ends so the box fades out in the corner it appeared in
    const direction = resultsStatus.message?.direction
    const [loadingMoreDirection, setLoadingMoreDirection] = useState(direction)
    if (isLoadingMore && direction && direction !== loadingMoreDirection) {
        setLoadingMoreDirection(direction)
    }

    return (
        <>
            <div className={clsx(c.ResultsStatus, { [c.hidden]: isHidden })}>
                <Paper className={c.paper} elevation={2}>
                    {inner}
                </Paper>
            </div>
            {/* Fast pages finish within the delay and never show the box */}
            <Fade
                in={isLoadingMore}
                timeout={200}
                style={{ transitionDelay: isLoadingMore ? `${LOADING_MORE_DELAY_MS}ms` : '0ms' }}
            >
                <div
                    className={clsx(
                        c.loadingMore,
                        loadingMoreDirection === 'up' ? c.loadingMoreTop : c.loadingMoreBottom
                    )}
                    role="status"
                    aria-label="Loading more results"
                >
                    <CircularProgress size={20} />
                </div>
            </Fade>
        </>
    )
}

ResultsStatus.propTypes = {}

export default ResultsStatus
