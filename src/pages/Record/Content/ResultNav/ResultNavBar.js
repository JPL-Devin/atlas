import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

// Variant B: a slim bar above the title row; neighbor titles show on hover.
const useStyles = makeStyles((theme) => ({
    spinner: {
        color: theme.palette.swatches.grey.grey700,
    },
    ResultNavBar: {
        display: 'flex',
        alignItems: 'stretch',
        height: '28px',
        background: theme.palette.swatches.grey.grey150,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey700,
    },
    edge: {
        'display': 'flex',
        'alignItems': 'center',
        'gap': '2px',
        'padding': '0 10px 0 4px',
        'fontSize': '12px',
        'color': 'inherit',
        'transition': 'background 0.15s ease-out, color 0.15s ease-out',
        '&:hover': {
            color: theme.palette.swatches.grey.grey900,
            background: theme.palette.swatches.grey.grey200,
        },
        '&.Mui-disabled': {
            color: theme.palette.swatches.grey.grey300,
        },
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
        },
    },
    edgeNext: {
        padding: '0 4px 0 10px',
    },
    center: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
    },
    count: {
        fontWeight: 'bold',
        color: theme.palette.swatches.grey.grey900,
    },
    tooltipLabel: {
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        opacity: 0.7,
    },
    tooltipTitle: {
        fontFamily: 'monospace',
        wordBreak: 'break-all',
    },
}))

const NeighborTooltip = ({ label, title }) => {
    const c = useStyles()
    return (
        <div>
            <div className={c.tooltipLabel}>{label}</div>
            <div className={c.tooltipTitle}>{title}</div>
        </div>
    )
}

NeighborTooltip.propTypes = {
    label: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
}

const ResultNavBar = (props) => {
    const { nav } = props
    const c = useStyles()

    const nextTooltip = nav.loadingNext ? (
        'Loading the next page of results…'
    ) : nav.next ? (
        <NeighborTooltip label="Next result" title={nav.next.title} />
    ) : nav.hasMore ? (
        'Next result is on the next page — it loads on click'
    ) : (
        'This is the last result'
    )

    return (
        <nav className={c.ResultNavBar} aria-label="result navigation">
            <Tooltip
                title={
                    nav.prev ? (
                        <NeighborTooltip label="Previous result" title={nav.prev.title} />
                    ) : (
                        'This is the first result'
                    )
                }
                placement="bottom-start"
            >
                <span style={{ display: 'flex' }}>
                    <ButtonBase
                        className={c.edge}
                        aria-label="previous result"
                        disabled={!nav.canPrev}
                        onClick={nav.goPrev}
                    >
                        <ChevronLeftIcon />
                        Prev
                    </ButtonBase>
                </span>
            </Tooltip>
            <div className={c.center} aria-live="polite">
                <span className={c.count}>
                    {nav.index + 1}&nbsp;/&nbsp;{nav.total.toLocaleString()}
                </span>
                &nbsp;search results
            </div>
            <Tooltip title={nextTooltip} placement="bottom-end">
                <span style={{ display: 'flex' }}>
                    <ButtonBase
                        className={`${c.edge} ${c.edgeNext}`}
                        aria-label="next result"
                        aria-busy={nav.loadingNext}
                        disabled={!nav.canNext}
                        onClick={nav.goNext}
                    >
                        {nav.loadingNext ? 'Loading' : 'Next'}
                        {nav.loadingNext ? (
                            <CircularProgress
                                className={c.spinner}
                                size={12}
                                sx={{ ml: '4px', mr: '3px' }}
                            />
                        ) : (
                            <ChevronRightIcon />
                        )}
                    </ButtonBase>
                </span>
            </Tooltip>
        </nav>
    )
}

ResultNavBar.propTypes = {
    nav: PropTypes.object.isRequired,
}

export default ResultNavBar
