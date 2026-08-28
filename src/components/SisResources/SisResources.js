import React from 'react'
import PropTypes from 'prop-types'

import Tooltip from '@mui/material/Tooltip'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { makeStyles } from '@mui/styles'

import {
    formatSisSize,
    formatSisTitle,
    getLatestSis,
    getSisForInstrument,
    getSisGap,
} from '../../core/sis.js'

const useStyles = makeStyles((theme) => ({
    cards: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '8px',
        marginBottom: '20px',
    },
    card: {
        'boxSizing': 'border-box',
        'display': 'grid',
        'gridTemplateColumns': 'auto minmax(0, 1fr) auto',
        'alignItems': 'center',
        'columnGap': '10px',
        'padding': '10px',
        'borderRadius': '3px',
        'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'background': theme.palette.swatches.grey.grey0,
        'color': 'inherit',
        'textDecoration': 'none',
        'transition': 'border-color 0.15s ease-out, box-shadow 0.15s ease-out',
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey300,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        },
    },
    badge: {
        'display': 'flex',
        'alignItems': 'center',
        'justifyContent': 'center',
        'width': '32px',
        'height': '32px',
        'borderRadius': '3px',
        'background': theme.palette.swatches.grey.grey150,
        'color': theme.palette.swatches.grey.grey600,
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
        },
    },
    title: {
        overflow: 'hidden',
        color: theme.palette.swatches.grey.grey700,
        fontSize: '14px',
        fontWeight: 'bold',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    note: {
        color: theme.palette.swatches.grey.grey500,
        fontSize: '12px',
        lineHeight: 1.4,
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: theme.palette.swatches.grey.grey500,
        fontSize: '12px',
    },
    actionIcon: {
        fontSize: '16px',
    },
    // A recorded absence reads as a resource too, so it keeps the card rhythm.
    gapCard: {
        boxSizing: 'border-box',
        padding: '10px 12px',
        marginBottom: '20px',
        borderRadius: '3px',
        border: `1px dashed ${theme.palette.swatches.grey.grey200}`,
        color: theme.palette.swatches.grey.grey600,
        fontSize: '13px',
        fontStyle: 'italic',
        lineHeight: 1.5,
    },
}))

/**
 * The current SIS defining a mission or instrument's data as a linked card, or
 * the recorded reason none exists. Renders nothing when neither is known.
 */
export const SisResources = (props) => {
    const { mission, instruments, headingClassName, heading } = props

    const c = useStyles()

    const sis = getLatestSis(getSisForInstrument(mission, instruments))
    const gap = sis == null ? getSisGap(mission, instruments) : null

    if (sis == null && gap == null) return null

    const size = formatSisSize(sis?.size)

    return (
        <>
            <div className={headingClassName}>{heading}</div>
            {gap != null && <div className={c.gapCard}>{gap.note}</div>}
            {sis != null && (
                <div className={c.cards} aria-label="related resources">
                    <Tooltip
                        title="Software Interface Specification — defines this product’s data"
                        arrow
                    >
                        <a
                            className={c.card}
                            href={sis.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div className={c.badge}>
                                <DescriptionOutlinedIcon />
                            </div>
                            <div>
                                <div className={c.title}>{formatSisTitle(sis)}</div>
                                {sis.note != null && (
                                    <div className={c.note}>{sis.note}</div>
                                )}
                            </div>
                            <div className={c.actions}>
                                {size != null && <span>{size}</span>}
                                <OpenInNewIcon className={c.actionIcon} />
                            </div>
                        </a>
                    </Tooltip>
                </div>
            )}
        </>
    )
}

SisResources.propTypes = {
    mission: PropTypes.string,
    instruments: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    headingClassName: PropTypes.string,
    heading: PropTypes.string,
}

SisResources.defaultProps = {
    heading: 'Related Resources',
}

export default SisResources
