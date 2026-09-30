import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

// Variant C: breadcrumb-style links that stand in for the title row's back button.
const useStyles = makeStyles((theme) => ({
    spinner: {
        color: theme.palette.swatches.grey.grey700,
    },
    ResultNavBreadcrumb: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '6px 8px 0 8px',
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey400,
    },
    link: {
        'padding': '2px 6px',
        'borderRadius': '2px',
        'fontSize': '12px',
        'color': theme.palette.swatches.grey.grey700,
        'whiteSpace': 'nowrap',
        '&:hover': {
            color: theme.palette.swatches.grey.grey900,
            background: theme.palette.swatches.grey.grey150,
            textDecoration: 'underline',
        },
        '&.Mui-disabled': {
            color: theme.palette.swatches.grey.grey300,
        },
    },
    back: {
        fontWeight: 'bold',
    },
    separator: {
        userSelect: 'none',
    },
}))

const ResultNavBreadcrumb = (props) => {
    const { nav } = props
    const c = useStyles()

    return (
        <nav className={c.ResultNavBreadcrumb} aria-label="result navigation">
            <Tooltip title={nav.prev ? nav.prev.title : ''} arrow>
                <span>
                    <ButtonBase
                        className={c.link}
                        aria-label="previous result"
                        disabled={!nav.canPrev}
                        onClick={nav.goPrev}
                    >
                        ‹ Prev result
                    </ButtonBase>
                </span>
            </Tooltip>
            <span className={c.separator}>|</span>
            <Tooltip title={`Result ${nav.index + 1} of ${nav.total.toLocaleString()}`} arrow>
                <ButtonBase
                    className={`${c.link} ${c.back}`}
                    aria-label="back to results"
                    onClick={nav.backToResults}
                >
                    Back to results
                </ButtonBase>
            </Tooltip>
            <span className={c.separator}>|</span>
            <Tooltip
                title={nav.next ? nav.next.title : nav.loadingNext ? '' : 'Loads the next page'}
                arrow
            >
                <span>
                    <ButtonBase
                        className={c.link}
                        aria-label="next result"
                        aria-busy={nav.loadingNext}
                        disabled={!nav.canNext}
                        onClick={nav.goNext}
                    >
                        {nav.loadingNext ? (
                            <>
                                Loading&nbsp;
                                <CircularProgress className={c.spinner} size={10} />
                            </>
                        ) : (
                            'Next result ›'
                        )}
                    </ButtonBase>
                </span>
            </Tooltip>
        </nav>
    )
}

ResultNavBreadcrumb.propTypes = {
    nav: PropTypes.object.isRequired,
}

export default ResultNavBreadcrumb
