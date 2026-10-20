import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

// Variant A: prev/next in the PanelHeader actions row.
const useStyles = makeStyles((theme) => ({
    spinner: {
        color: theme.palette.swatches.grey.grey700,
    },
    ResultNavActions: {
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
        marginRight: '8px',
    },
    step: {
        'color': theme.palette.swatches.grey.grey700,
        'background': theme.palette.swatches.grey.grey0,
        'borderColor': theme.palette.swatches.grey.grey300,
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey500,
            background: theme.palette.swatches.grey.grey150,
        },
        '&.MuiButton-root': {
            padding: '4px 4px',
        },
    },
    prev: {
        '&.MuiButton-root': {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
        },
    },
    next: {
        '&.MuiButton-root': {
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
        },
    },
    position: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        color: theme.palette.swatches.grey.grey700,
        background: theme.palette.swatches.grey.grey0,
        borderTop: `1px solid ${theme.palette.swatches.grey.grey300}`,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey300}`,
        fontVariantNumeric: 'tabular-nums',
    },
    positionWord: {
        marginRight: '4px',
        [theme.breakpoints.down('lg')]: {
            display: 'none',
        },
    },
}))

const ResultNavActions = (props) => {
    const { nav } = props
    const c = useStyles()

    return (
        <div className={c.ResultNavActions} role="group" aria-label="result navigation">
            <Tooltip title={nav.prev ? `Previous: ${nav.prev.title}` : 'No previous result'} arrow>
                <span style={{ display: 'flex' }}>
                    <Button
                        className={`${c.step} ${c.prev}`}
                        variant="outlined"
                        size="small"
                        aria-label="previous result"
                        disabled={!nav.canPrev}
                        onClick={nav.goPrev}
                    >
                        <ChevronLeftIcon />
                    </Button>
                </span>
            </Tooltip>
            <div className={c.position} aria-live="polite">
                <span className={c.positionWord}>Result</span>
                {nav.index + 1} of {nav.total.toLocaleString()}
            </div>
            <Tooltip
                title={
                    nav.loadingNext
                        ? 'Loading more results…'
                        : nav.next
                          ? `Next: ${nav.next.title}`
                          : nav.hasMore
                            ? 'Next result (loads the next page)'
                            : 'No next result'
                }
                arrow
            >
                <span style={{ display: 'flex' }}>
                    <Button
                        className={`${c.step} ${c.next}`}
                        variant="outlined"
                        size="small"
                        aria-label="next result"
                        aria-busy={nav.loadingNext}
                        disabled={!nav.canNext}
                        onClick={nav.goNext}
                    >
                        {nav.loadingNext ? (
                            <CircularProgress className={c.spinner} size={14} />
                        ) : (
                            <ChevronRightIcon />
                        )}
                    </Button>
                </span>
            </Tooltip>
        </div>
    )
}

ResultNavActions.propTypes = {
    nav: PropTypes.object.isRequired,
}

export default ResultNavActions
