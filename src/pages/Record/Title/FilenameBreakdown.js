import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import Tooltip from '@mui/material/Tooltip'

import { getIn } from '../../../core/utils'
import { parseFilename, resolveFilenameSpec } from '../../../core/recordPresentation'
import { LIGHT_COLORS } from '../filenameColors'

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
                            style={{ color: LIGHT_COLORS[piece.color] || 'inherit' }}
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
