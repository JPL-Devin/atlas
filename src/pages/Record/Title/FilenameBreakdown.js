import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import Tooltip from '@mui/material/Tooltip'

import { getIn } from '../../../core/utils'
import { parseFilename, resolveFilenameSpec } from '../../../core/recordPresentation'

// Segment colours, referenced by name from the filename specs. Tuned for at
// least 4.5:1 on the light title bar; the swatch has too few hues to reuse.
const COLORS = {
    blue: '#0B62C4',
    teal: '#00796B',
    green: '#2E7D32',
    cyan: '#006782',
    indigo: '#3F51B5',
    violet: '#7B1FA2',
    pink: '#C2185B',
    red: '#C62828',
    orange: '#B04A00',
    amber: '#7A5F00',
    brown: '#6D4C41',
    slate: '#5F6B76',
}

const useStyles = makeStyles((theme) => ({
    FilenameBreakdown: {
        fontFamily: 'monospace',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
    },
    segment: {
        'font': 'inherit',
        'padding': 0,
        'border': 'none',
        'background': 'none',
        'borderBottom': '2px solid transparent',
        'cursor': 'help',
        '&:hover, &:focus-visible': {
            borderBottomColor: 'currentColor',
        },
    },
    tooltip: {
        fontSize: 12,
        lineHeight: 1.4,
    },
    tipLabel: {
        fontWeight: 'bold',
    },
    tipValue: {
        fontFamily: 'monospace',
        color: theme.palette.swatches.grey.grey200,
    },
    tipMeaning: {
        marginTop: 2,
    },
    tipDescription: {
        marginTop: 4,
        color: theme.palette.swatches.grey.grey200,
    },
}))

const first = (value) => (Array.isArray(value) ? value[0] : value)

const FilenameBreakdown = (props) => {
    const { filename, recordData } = props

    const c = useStyles()

    const spec = resolveFilenameSpec({
        mission: first(getIn(recordData, 'gather.common.mission')),
        pds_standard: first(getIn(recordData, 'gather.pds_archive.pds_standard')),
    })
    const parsed = parseFilename(filename, spec)

    if (parsed == null) return <>{filename}</>

    return (
        <span
            className={c.FilenameBreakdown}
            role="group"
            aria-label={`${filename}${parsed.title ? `, ${parsed.title}` : ''}`}>
            {parsed.pieces.map((piece, idx) => {
                if (piece.label == null) return <span key={idx}>{piece.text}</span>
                return (
                    <Tooltip
                        key={idx}
                        arrow
                        classes={{ tooltip: c.tooltip }}
                        title={
                            <>
                                <div>
                                    <span className={c.tipLabel}>{piece.label}</span>{' '}
                                    <span className={c.tipValue}>{piece.text}</span>
                                </div>
                                {piece.meaning && <div className={c.tipMeaning}>{piece.meaning}</div>}
                                {piece.description && (
                                    <div className={c.tipDescription}>{piece.description}</div>
                                )}
                            </>
                        }>
                        <button
                            type="button"
                            className={c.segment}
                            style={{ color: COLORS[piece.color] || 'inherit' }}
                            aria-label={`${piece.label}: ${piece.text}${
                                piece.meaning ? `, ${piece.meaning}` : ''
                            }`}>
                            {piece.text}
                        </button>
                    </Tooltip>
                )
            })}
        </span>
    )
}

FilenameBreakdown.propTypes = {
    filename: PropTypes.string,
    recordData: PropTypes.object,
}

export default FilenameBreakdown
